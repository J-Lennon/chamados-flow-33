import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, ticketData } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] | undefined;
    let toolChoice: any | undefined;

    switch (action) {
      case "classify": {
        systemPrompt = `Você é um assistente de classificação de chamados de suporte técnico de TI.
Analise o título e descrição do chamado e classifique automaticamente.
Responda SEMPRE usando a ferramenta fornecida.`;
        
        userPrompt = `Classifique este chamado:
Título: ${ticketData.title}
Descrição: ${ticketData.description}
${ticketData.department ? `Departamento: ${ticketData.department}` : ""}`;

        tools = [{
          type: "function",
          function: {
            name: "classify_ticket",
            description: "Classifica um chamado de suporte",
            parameters: {
              type: "object",
              properties: {
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "Prioridade do chamado baseada no impacto e urgência"
                },
                category: {
                  type: "string",
                  enum: ["hardware", "software", "rede", "acesso", "email", "impressora", "telefonia", "infraestrutura", "seguranca", "outros"],
                  description: "Categoria principal do chamado"
                },
                urgency: {
                  type: "string",
                  enum: ["baixa", "media", "alta", "critica"],
                  description: "Nível de urgência real baseado no contexto"
                },
                nivel_atendimento: {
                  type: "integer",
                  enum: [1, 2, 3],
                  description: "Nível de atendimento sugerido: 1=suporte básico (reset senha, dúvidas simples), 2=suporte técnico (configuração, diagnóstico avançado), 3=especialista/engenharia (infraestrutura crítica, segurança, desenvolvimento)"
                },
                summary: {
                  type: "string",
                  description: "Resumo conciso do problema em uma frase (máximo 100 caracteres)"
                },
                isWellDescribed: {
                  type: "boolean",
                  description: "Se o chamado está bem descrito com informações suficientes"
                },
                improvementSuggestion: {
                  type: "string",
                  description: "Se mal descrito, sugestão do que o usuário deveria informar. Vazio se bem descrito."
                }
              },
              required: ["priority", "category", "urgency", "nivel_atendimento", "summary", "isWellDescribed", "improvementSuggestion"]
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "classify_ticket" } };
        break;
      }

      case "suggest_response": {
        systemPrompt = `Você é um técnico de suporte de TI experiente e cordial.
Baseado no chamado e histórico de mensagens, sugira uma resposta profissional e útil.
Responda SEMPRE usando a ferramenta fornecida.`;

        const messagesText = ticketData.messages?.map((m: any) => 
          `${m.sender}: ${m.message}`
        ).join("\n") || "Nenhuma mensagem ainda";

        userPrompt = `Chamado: ${ticketData.title}
Descrição: ${ticketData.description}
Status: ${ticketData.status}
Prioridade: ${ticketData.priority}

Histórico de mensagens:
${messagesText}

Sugira uma resposta adequada para o técnico de suporte enviar.`;

        tools = [{
          type: "function",
          function: {
            name: "suggest_response",
            description: "Sugere uma resposta para o chamado",
            parameters: {
              type: "object",
              properties: {
                suggestedResponse: {
                  type: "string",
                  description: "Resposta sugerida para o técnico enviar ao usuário"
                },
                internalNote: {
                  type: "string",
                  description: "Nota interna com diagnóstico ou próximos passos para a equipe"
                }
              },
              required: ["suggestedResponse", "internalNote"]
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "suggest_response" } };
        break;
      }

      case "generate_knowledge_article": {
        systemPrompt = `Você é um redator técnico especializado em base de conhecimento de TI.
Gere um artigo claro e objetivo baseado no chamado resolvido.
Responda SEMPRE usando a ferramenta fornecida.`;

        userPrompt = `Chamado resolvido:
Título: ${ticketData.title}
Descrição: ${ticketData.description}
Mensagens de resolução:
${ticketData.messages?.map((m: any) => `${m.sender}: ${m.message}`).join("\n") || "N/A"}

Gere um artigo de base de conhecimento baseado neste chamado.`;

        tools = [{
          type: "function",
          function: {
            name: "generate_article",
            description: "Gera artigo para base de conhecimento",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título do artigo" },
                problem: { type: "string", description: "Descrição do problema" },
                solution: { type: "string", description: "Passo a passo da solução" },
                tags: { type: "array", items: { type: "string" }, description: "Tags relevantes" }
              },
              required: ["title", "problem", "solution", "tags"]
            }
          }
        }];
        toolChoice = { type: "function", function: { name: "generate_article" } };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro na API de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    
    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return content if no tool call
    const content = aiResponse.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ success: true, data: { content } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ai-ticket error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
