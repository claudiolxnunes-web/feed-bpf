export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agrogestao_metas: {
        Row: {
          created_at: string | null
          empresa_id: string
          gerente_id: string
          id: string
          periodo: string
          valor_meta: number
          valor_realizado: number | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          gerente_id: string
          id?: string
          periodo: string
          valor_meta: number
          valor_realizado?: number | null
          vendedor_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          gerente_id?: string
          id?: string
          periodo?: string
          valor_meta?: number
          valor_realizado?: number | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrogestao_metas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agrorc_clientes: {
        Row: {
          created_at: string | null
          documento: string | null
          email: string | null
          empresa_id: string
          id: string
          nome: string
          perfil_produtivo: Json | null
          regiao: string | null
          score_desempenho: number | null
          segmento: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          documento?: string | null
          email?: string | null
          empresa_id: string
          id?: string
          nome: string
          perfil_produtivo?: Json | null
          regiao?: string | null
          score_desempenho?: number | null
          segmento?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          documento?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          perfil_produtivo?: Json | null
          regiao?: string | null
          score_desempenho?: number | null
          segmento?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrorc_clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agrorc_pipeline: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_fechamento_prevista: string | null
          empresa_id: string
          etapa: string | null
          id: string
          titulo: string
          user_id: string
          valor: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_fechamento_prevista?: string | null
          empresa_id: string
          etapa?: string | null
          id?: string
          titulo: string
          user_id: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_fechamento_prevista?: string | null
          empresa_id?: string
          etapa?: string | null
          id?: string
          titulo?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agrorc_pipeline_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "agrorc_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agrorc_pipeline_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      agrorc_visitas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_planejada: string
          data_realizada: string | null
          empresa_id: string
          fotos: string[] | null
          geolocalizacao: Json | null
          id: string
          relatorio: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_planejada: string
          data_realizada?: string | null
          empresa_id: string
          fotos?: string[] | null
          geolocalizacao?: Json | null
          id?: string
          relatorio?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_planejada?: string
          data_realizada?: string | null
          empresa_id?: string
          fotos?: string[] | null
          geolocalizacao?: Json | null
          id?: string
          relatorio?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agrorc_visitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "agrorc_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agrorc_visitas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_feedback: {
        Row: {
          assistant_response: string
          created_at: string
          feedback_text: string | null
          id: string
          rating: number
          user_id: string | null
          user_query: string | null
        }
        Insert: {
          assistant_response: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating: number
          user_id?: string | null
          user_query?: string | null
        }
        Update: {
          assistant_response?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          rating?: number
          user_id?: string | null
          user_query?: string | null
        }
        Relationships: []
      }
      ai_lead_insights: {
        Row: {
          created_at: string
          gerado_por: string | null
          id: string
          lead_id: string
          lead_origem: string | null
          proxima_acao: string | null
          rascunho_email: string | null
          rascunho_whatsapp: string | null
          resumo: string | null
          score: number | null
          sinais_compra: Json | null
          temperatura: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gerado_por?: string | null
          id?: string
          lead_id: string
          lead_origem?: string | null
          proxima_acao?: string | null
          rascunho_email?: string | null
          rascunho_whatsapp?: string | null
          resumo?: string | null
          score?: number | null
          sinais_compra?: Json | null
          temperatura?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gerado_por?: string | null
          id?: string
          lead_id?: string
          lead_origem?: string | null
          proxima_acao?: string | null
          rascunho_email?: string | null
          rascunho_whatsapp?: string | null
          resumo?: string | null
          score?: number | null
          sinais_compra?: Json | null
          temperatura?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      amostras_retencao: {
        Row: {
          created_at: string
          data_coleta: string
          data_descarte: string | null
          empresa_id: string | null
          id: string
          local_armazenamento: string | null
          lote: string
          observacoes: string | null
          prazo_descarte: string | null
          produto: string
          quantidade_g: number | null
          responsavel_coleta: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_coleta?: string
          data_descarte?: string | null
          empresa_id?: string | null
          id?: string
          local_armazenamento?: string | null
          lote: string
          observacoes?: string | null
          prazo_descarte?: string | null
          produto: string
          quantidade_g?: number | null
          responsavel_coleta?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_coleta?: string
          data_descarte?: string | null
          empresa_id?: string | null
          id?: string
          local_armazenamento?: string | null
          lote?: string
          observacoes?: string | null
          prazo_descarte?: string | null
          produto?: string
          quantidade_g?: number | null
          responsavel_coleta?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amostras_retencao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      analises_laboratorio: {
        Row: {
          conforme: boolean | null
          created_at: string
          data_analise: string | null
          data_resultado: string | null
          data_verificacao: string | null
          empresa_id: string | null
          id: string
          laboratorio: string | null
          laudo_numero: string | null
          laudo_url: string | null
          limite_referencia: string | null
          lote: string | null
          metodo: string | null
          observacoes: string | null
          parametro: string | null
          produto: string
          resultado: string | null
          status: string | null
          status_verificacao: string | null
          tipo_analise: string
          unidade: string | null
          updated_at: string
          user_id: string
          verificado_por: string | null
        }
        Insert: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          data_resultado?: string | null
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          laboratorio?: string | null
          laudo_numero?: string | null
          laudo_url?: string | null
          limite_referencia?: string | null
          lote?: string | null
          metodo?: string | null
          observacoes?: string | null
          parametro?: string | null
          produto: string
          resultado?: string | null
          status?: string | null
          status_verificacao?: string | null
          tipo_analise?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
          verificado_por?: string | null
        }
        Update: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          data_resultado?: string | null
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          laboratorio?: string | null
          laudo_numero?: string | null
          laudo_url?: string | null
          limite_referencia?: string | null
          lote?: string | null
          metodo?: string | null
          observacoes?: string | null
          parametro?: string | null
          produto?: string
          resultado?: string | null
          status?: string | null
          status_verificacao?: string | null
          tipo_analise?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analises_laboratorio_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      app_error_logs: {
        Row: {
          app_version: string | null
          boot_elapsed_ms: number | null
          component_stack: string | null
          created_at: string
          error_type: string
          extra: Json | null
          fixed_in_version: string | null
          id: string
          message: string | null
          resolution_notes: string | null
          resolved_at: string | null
          route: string | null
          stack: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          boot_elapsed_ms?: number | null
          component_stack?: string | null
          created_at?: string
          error_type: string
          extra?: Json | null
          fixed_in_version?: string | null
          id?: string
          message?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          route?: string | null
          stack?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          boot_elapsed_ms?: number | null
          component_stack?: string | null
          created_at?: string
          error_type?: string
          extra?: Json | null
          fixed_in_version?: string | null
          id?: string
          message?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          route?: string | null
          stack?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      arquivos_bpf: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string
          created_at: string
          data_ref: string | null
          descricao: string | null
          documento_ref_id: string | null
          empresa_id: string | null
          frequencia: string | null
          id: string
          it_codigo: string | null
          nome_padronizado: string | null
          numero_doc: number | null
          pop_codigo: string | null
          tipo_doc: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria: string
          created_at?: string
          data_ref?: string | null
          descricao?: string | null
          documento_ref_id?: string | null
          empresa_id?: string | null
          frequencia?: string | null
          id?: string
          it_codigo?: string | null
          nome_padronizado?: string | null
          numero_doc?: number | null
          pop_codigo?: string | null
          tipo_doc?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string
          created_at?: string
          data_ref?: string | null
          descricao?: string | null
          documento_ref_id?: string | null
          empresa_id?: string | null
          frequencia?: string | null
          id?: string
          it_codigo?: string | null
          nome_padronizado?: string | null
          numero_doc?: number | null
          pop_codigo?: string | null
          tipo_doc?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_bpf_documento_ref_id_fkey"
            columns: ["documento_ref_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arquivos_bpf_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          empresa_id: string | null
          id: string
          ip_address: string | null
          registro_id: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      auditor_acessos: {
        Row: {
          acessado_em: string
          empresa_id: string
          id: string
          ip_address: string | null
          modulo: string
          recurso_id: string | null
          token_id: string
          user_agent: string | null
        }
        Insert: {
          acessado_em?: string
          empresa_id: string
          id?: string
          ip_address?: string | null
          modulo: string
          recurso_id?: string | null
          token_id: string
          user_agent?: string | null
        }
        Update: {
          acessado_em?: string
          empresa_id?: string
          id?: string
          ip_address?: string | null
          modulo?: string
          recurso_id?: string | null
          token_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditor_acessos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditor_acessos_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "auditor_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      auditor_tokens: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string
          empresa_id: string
          expira_em: string
          id: string
          nome_auditor: string | null
          observacoes: string | null
          orgao_fiscalizador: string | null
          revogado_em: string | null
          token_hash: string
          total_acessos: number
          ultimo_acesso_em: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por: string
          empresa_id: string
          expira_em: string
          id?: string
          nome_auditor?: string | null
          observacoes?: string | null
          orgao_fiscalizador?: string | null
          revogado_em?: string | null
          token_hash: string
          total_acessos?: number
          ultimo_acesso_em?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string
          empresa_id?: string
          expira_em?: string
          id?: string
          nome_auditor?: string | null
          observacoes?: string | null
          orgao_fiscalizador?: string | null
          revogado_em?: string | null
          token_hash?: string
          total_acessos?: number
          ultimo_acesso_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditor_tokens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      batida_lotes: {
        Row: {
          created_at: string
          empresa_id: string | null
          fornecedor: string | null
          id: string
          lote_mp: string | null
          materia_prima: string
          numero_batida: number
          ordem_id: string
          quantidade_kg: number
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          lote_mp?: string | null
          materia_prima: string
          numero_batida?: number
          ordem_id: string
          quantidade_kg?: number
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          lote_mp?: string | null
          materia_prima?: string
          numero_batida?: number
          ordem_id?: string
          quantidade_kg?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batida_lotes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batida_lotes_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      batidas_producao: {
        Row: {
          created_at: string
          empresa_id: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          numero_batida: number
          observacoes: string | null
          operador: string | null
          ordem_id: string
          status: string | null
          temperatura: string | null
          tempo_mistura_minutos: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          numero_batida?: number
          observacoes?: string | null
          operador?: string | null
          ordem_id: string
          status?: string | null
          temperatura?: string | null
          tempo_mistura_minutos?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          numero_batida?: number
          observacoes?: string | null
          operador?: string | null
          ordem_id?: string
          status?: string | null
          temperatura?: string | null
          tempo_mistura_minutos?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batidas_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batidas_producao_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      calibracoes: {
        Row: {
          certificado_numero: string | null
          codigo: string | null
          created_at: string
          data_calibracao: string | null
          data_verificacao_intermediaria: string | null
          empresa_id: string | null
          equipamento: string
          id: string
          localizacao: string | null
          observacoes: string | null
          proxima_calibracao: string | null
          proxima_verificacao_intermediaria: string | null
          responsavel: string | null
          resultado_verificacao: string | null
          status: string | null
          tipo: string | null
          updated_at: string
          user_id: string
          verificacao_conforme: boolean | null
        }
        Insert: {
          certificado_numero?: string | null
          codigo?: string | null
          created_at?: string
          data_calibracao?: string | null
          data_verificacao_intermediaria?: string | null
          empresa_id?: string | null
          equipamento: string
          id?: string
          localizacao?: string | null
          observacoes?: string | null
          proxima_calibracao?: string | null
          proxima_verificacao_intermediaria?: string | null
          responsavel?: string | null
          resultado_verificacao?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id: string
          verificacao_conforme?: boolean | null
        }
        Update: {
          certificado_numero?: string | null
          codigo?: string | null
          created_at?: string
          data_calibracao?: string | null
          data_verificacao_intermediaria?: string | null
          empresa_id?: string | null
          equipamento?: string
          id?: string
          localizacao?: string | null
          observacoes?: string | null
          proxima_calibracao?: string | null
          proxima_verificacao_intermediaria?: string | null
          responsavel?: string | null
          resultado_verificacao?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id?: string
          verificacao_conforme?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "calibracoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_mensagens: {
        Row: {
          agendado_para: string
          campanha_id: string
          created_at: string
          empresa: string | null
          enviado_em: string | null
          erro: string | null
          id: string
          mensagem_final: string
          nome: string | null
          produto: string | null
          status: string
          telefone: string
          tentativas: number
        }
        Insert: {
          agendado_para?: string
          campanha_id: string
          created_at?: string
          empresa?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem_final: string
          nome?: string | null
          produto?: string | null
          status?: string
          telefone: string
          tentativas?: number
        }
        Update: {
          agendado_para?: string
          campanha_id?: string
          created_at?: string
          empresa?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem_final?: string
          nome?: string | null
          produto?: string | null
          status?: string
          telefone?: string
          tentativas?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_mensagens_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_optout: {
        Row: {
          created_at: string
          motivo: string | null
          telefone: string
        }
        Insert: {
          created_at?: string
          motivo?: string | null
          telefone: string
        }
        Update: {
          created_at?: string
          motivo?: string | null
          telefone?: string
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          concluida_em: string | null
          created_at: string
          created_by: string | null
          empresa_id: string | null
          enviados: number
          enviados_hoje: number
          enviados_hoje_data: string | null
          erros: number
          filtros: Json
          id: string
          iniciada_em: string | null
          intervalo_max_seg: number
          intervalo_min_seg: number
          limite_diario: number
          nome: string
          optouts: number
          origem: string
          pausa_a_cada: number
          pausa_duracao_seg: number
          status: string
          template_texto: string
          total: number
          ultimo_envio_em: string | null
          updated_at: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          enviados?: number
          enviados_hoje?: number
          enviados_hoje_data?: string | null
          erros?: number
          filtros?: Json
          id?: string
          iniciada_em?: string | null
          intervalo_max_seg?: number
          intervalo_min_seg?: number
          limite_diario?: number
          nome: string
          optouts?: number
          origem?: string
          pausa_a_cada?: number
          pausa_duracao_seg?: number
          status?: string
          template_texto: string
          total?: number
          ultimo_envio_em?: string | null
          updated_at?: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          enviados?: number
          enviados_hoje?: number
          enviados_hoje_data?: string | null
          erros?: number
          filtros?: Json
          id?: string
          iniciada_em?: string | null
          intervalo_max_seg?: number
          intervalo_min_seg?: number
          limite_diario?: number
          nome?: string
          optouts?: number
          origem?: string
          pausa_a_cada?: number
          pausa_duracao_seg?: number
          status?: string
          template_texto?: string
          total?: number
          ultimo_envio_em?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          area: string
          auditoria_data: string | null
          conforme: boolean | null
          created_at: string
          empresa_id: string | null
          id: string
          item: string
          observacao: string | null
          user_id: string
        }
        Insert: {
          area: string
          auditoria_data?: string | null
          conforme?: boolean | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          item: string
          observacao?: string | null
          user_id: string
        }
        Update: {
          area?: string
          auditoria_data?: string | null
          conforme?: boolean | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          item?: string
          observacao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_pragas: {
        Row: {
          acao: string | null
          created_at: string
          data: string
          data_verificacao: string | null
          empresa_id: string | null
          id: string
          local: string
          responsavel: string | null
          status_verificacao: string | null
          tipo_praga: string
          user_id: string
          verificado_por: string | null
        }
        Insert: {
          acao?: string | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          local: string
          responsavel?: string | null
          status_verificacao?: string | null
          tipo_praga: string
          user_id: string
          verificado_por?: string | null
        }
        Update: {
          acao?: string | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          local?: string
          responsavel?: string | null
          status_verificacao?: string | null
          tipo_praga?: string
          user_id?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "controle_pragas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_residuos: {
        Row: {
          classificacao: string | null
          created_at: string
          data_coleta: string | null
          destino_final: string | null
          empresa_coletora: string | null
          empresa_id: string | null
          frequencia_coleta: string | null
          id: string
          licenca_ambiental: string | null
          lote_produto: string | null
          manifesto_numero: string | null
          motivo_descarte: string | null
          observacoes: string | null
          origem: string | null
          produto_nome: string | null
          quantidade: string | null
          responsavel: string | null
          status: string | null
          tipo_residuo: string
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          classificacao?: string | null
          created_at?: string
          data_coleta?: string | null
          destino_final?: string | null
          empresa_coletora?: string | null
          empresa_id?: string | null
          frequencia_coleta?: string | null
          id?: string
          licenca_ambiental?: string | null
          lote_produto?: string | null
          manifesto_numero?: string | null
          motivo_descarte?: string | null
          observacoes?: string | null
          origem?: string | null
          produto_nome?: string | null
          quantidade?: string | null
          responsavel?: string | null
          status?: string | null
          tipo_residuo: string
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          classificacao?: string | null
          created_at?: string
          data_coleta?: string | null
          destino_final?: string | null
          empresa_coletora?: string | null
          empresa_id?: string | null
          frequencia_coleta?: string | null
          id?: string
          licenca_ambiental?: string | null
          lote_produto?: string | null
          manifesto_numero?: string | null
          motivo_descarte?: string | null
          observacoes?: string | null
          origem?: string | null
          produto_nome?: string | null
          quantidade?: string | null
          responsavel?: string | null
          status?: string | null
          tipo_residuo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_residuos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_substancias: {
        Row: {
          conforme: boolean | null
          created_at: string
          data_analise: string | null
          empresa_id: string | null
          fornecedor: string | null
          id: string
          limite_maximo: string | null
          lote: string | null
          materia_prima: string
          metodo_analise: string | null
          observacoes: string | null
          referencia_normativa: string | null
          resultado: string | null
          status: string | null
          substancia: string
          tipo: string
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          limite_maximo?: string | null
          lote?: string | null
          materia_prima: string
          metodo_analise?: string | null
          observacoes?: string | null
          referencia_normativa?: string | null
          resultado?: string | null
          status?: string | null
          substancia: string
          tipo?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conforme?: boolean | null
          created_at?: string
          data_analise?: string | null
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          limite_maximo?: string | null
          lote?: string | null
          materia_prima?: string
          metodo_analise?: string | null
          observacoes?: string | null
          referencia_normativa?: string | null
          resultado?: string | null
          status?: string | null
          substancia?: string
          tipo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_substancias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_visitantes: {
        Row: {
          acompanhante: string | null
          areas_visitadas: string | null
          created_at: string
          data_visita: string
          documento: string | null
          empresa: string | null
          empresa_id: string | null
          epi_fornecido: boolean | null
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          motivo: string | null
          nome_visitante: string
          observacoes: string | null
          orientacao_biosseguridade: boolean | null
          user_id: string
        }
        Insert: {
          acompanhante?: string | null
          areas_visitadas?: string | null
          created_at?: string
          data_visita?: string
          documento?: string | null
          empresa?: string | null
          empresa_id?: string | null
          epi_fornecido?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          motivo?: string | null
          nome_visitante: string
          observacoes?: string | null
          orientacao_biosseguridade?: boolean | null
          user_id: string
        }
        Update: {
          acompanhante?: string | null
          areas_visitadas?: string | null
          created_at?: string
          data_visita?: string
          documento?: string | null
          empresa?: string | null
          empresa_id?: string | null
          epi_fornecido?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          motivo?: string | null
          nome_visitante?: string
          observacoes?: string | null
          orientacao_biosseguridade?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controle_visitantes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      convites_empresa: {
        Row: {
          aceito_em: string | null
          aceito_por: string | null
          convidado_por: string
          created_at: string
          email: string
          empresa_id: string
          expira_em: string
          id: string
          nome: string | null
          papel: Database["public"]["Enums"]["papel_empresa"]
          token_hash: string
        }
        Insert: {
          aceito_em?: string | null
          aceito_por?: string | null
          convidado_por: string
          created_at?: string
          email: string
          empresa_id: string
          expira_em?: string
          id?: string
          nome?: string | null
          papel?: Database["public"]["Enums"]["papel_empresa"]
          token_hash: string
        }
        Update: {
          aceito_em?: string | null
          aceito_por?: string | null
          convidado_por?: string
          created_at?: string
          email?: string
          empresa_id?: string
          expira_em?: string
          id?: string
          nome?: string | null
          papel?: Database["public"]["Enums"]["papel_empresa"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_cadencia_execucoes: {
        Row: {
          cadencia_id: string
          created_at: string
          id: string
          lead_email: string | null
          lead_nome: string | null
          lead_telefone: string | null
          passo_atual: number
          pipeline_id: string | null
          proximo_envio_em: string
          status: string
          ultimo_erro: string | null
          updated_at: string
        }
        Insert: {
          cadencia_id: string
          created_at?: string
          id?: string
          lead_email?: string | null
          lead_nome?: string | null
          lead_telefone?: string | null
          passo_atual?: number
          pipeline_id?: string | null
          proximo_envio_em?: string
          status?: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Update: {
          cadencia_id?: string
          created_at?: string
          id?: string
          lead_email?: string | null
          lead_nome?: string | null
          lead_telefone?: string | null
          passo_atual?: number
          pipeline_id?: string | null
          proximo_envio_em?: string
          status?: string
          ultimo_erro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_cadencia_execucoes_cadencia_id_fkey"
            columns: ["cadencia_id"]
            isOneToOne: false
            referencedRelation: "crm_cadencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_cadencia_execucoes_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_cadencias: {
        Row: {
          ativo: boolean
          created_at: string
          etapa_gatilho: string
          id: string
          nome: string
          passos: Json
          produto: string | null
          tier_gatilho: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          etapa_gatilho?: string
          id?: string
          nome: string
          passos?: Json
          produto?: string | null
          tier_gatilho?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          etapa_gatilho?: string
          id?: string
          nome?: string
          passos?: Json
          produto?: string | null
          tier_gatilho?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_emails_enviados: {
        Row: {
          assunto: string
          corpo_html: string
          created_at: string
          enviado_por: string
          enviado_por_nome: string | null
          erro: string | null
          id: string
          message_id: string | null
          para_email: string
          pipeline_id: string
          status: string
        }
        Insert: {
          assunto: string
          corpo_html: string
          created_at?: string
          enviado_por: string
          enviado_por_nome?: string | null
          erro?: string | null
          id?: string
          message_id?: string | null
          para_email: string
          pipeline_id: string
          status?: string
        }
        Update: {
          assunto?: string
          corpo_html?: string
          created_at?: string
          enviado_por?: string
          enviado_por_nome?: string | null
          erro?: string | null
          id?: string
          message_id?: string | null
          para_email?: string
          pipeline_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_emails_enviados_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_interacoes: {
        Row: {
          autor_id: string
          autor_nome: string | null
          created_at: string
          descricao: string
          id: string
          pipeline_id: string
          tipo: string
        }
        Insert: {
          autor_id: string
          autor_nome?: string | null
          created_at?: string
          descricao: string
          id?: string
          pipeline_id: string
          tipo: string
        }
        Update: {
          autor_id?: string
          autor_nome?: string | null
          created_at?: string
          descricao?: string
          id?: string
          pipeline_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_interacoes_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline: {
        Row: {
          created_at: string
          email: string | null
          empresa: string | null
          etapa: string
          ganho_em: string | null
          id: string
          lead_id: string | null
          lead_origem: string
          motivo_perda: string | null
          nome: string
          observacoes: string | null
          perdido_em: string | null
          produto_interesse: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          telefone: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          etapa?: string
          ganho_em?: string | null
          id?: string
          lead_id?: string | null
          lead_origem: string
          motivo_perda?: string | null
          nome: string
          observacoes?: string | null
          perdido_em?: string | null
          produto_interesse?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          etapa?: string
          ganho_em?: string | null
          id?: string
          lead_id?: string | null
          lead_origem?: string
          motivo_perda?: string | null
          nome?: string
          observacoes?: string | null
          perdido_em?: string | null
          produto_interesse?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: []
      }
      crm_tarefas: {
        Row: {
          concluida_em: string | null
          created_at: string
          descricao: string | null
          id: string
          pipeline_id: string
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string
          titulo: string
          updated_at: string
          vencimento: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          pipeline_id: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          titulo: string
          updated_at?: string
          vencimento: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          pipeline_id?: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tarefas_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      cronogramas_higiene: {
        Row: {
          area: string
          concentracao: string | null
          created_at: string
          empresa_id: string | null
          equipamento: string | null
          frequencia: string
          horario_previsto: string | null
          id: string
          observacoes: string | null
          procedimento: string
          produto_utilizado: string | null
          responsavel: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          concentracao?: string | null
          created_at?: string
          empresa_id?: string | null
          equipamento?: string | null
          frequencia?: string
          horario_previsto?: string | null
          id?: string
          observacoes?: string | null
          procedimento: string
          produto_utilizado?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          concentracao?: string | null
          created_at?: string
          empresa_id?: string | null
          equipamento?: string | null
          frequencia?: string
          horario_previsto?: string | null
          id?: string
          observacoes?: string | null
          procedimento?: string
          produto_utilizado?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronogramas_higiene_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_aprovacoes: {
        Row: {
          aprovador_nome: string
          aprovador_user_id: string
          created_at: string
          documento_id: string
          empresa_id: string | null
          hash_assinatura: string
          id: string
          ip_address: string | null
          motivo: string | null
          status_anterior: string
          status_novo: string
          user_agent: string | null
          user_id: string
          versao: string | null
        }
        Insert: {
          aprovador_nome: string
          aprovador_user_id: string
          created_at?: string
          documento_id: string
          empresa_id?: string | null
          hash_assinatura: string
          id?: string
          ip_address?: string | null
          motivo?: string | null
          status_anterior: string
          status_novo: string
          user_agent?: string | null
          user_id: string
          versao?: string | null
        }
        Update: {
          aprovador_nome?: string
          aprovador_user_id?: string
          created_at?: string
          documento_id?: string
          empresa_id?: string | null
          hash_assinatura?: string
          id?: string
          ip_address?: string | null
          motivo?: string | null
          status_anterior?: string
          status_novo?: string
          user_agent?: string | null
          user_id?: string
          versao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documento_aprovacoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documento_aprovacoes_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_versoes: {
        Row: {
          alteracoes: string | null
          created_at: string
          data_revisao: string | null
          documento_id: string
          empresa_id: string | null
          id: string
          motivo: string | null
          responsavel: string | null
          user_id: string
          versao_anterior: string | null
          versao_nova: string
        }
        Insert: {
          alteracoes?: string | null
          created_at?: string
          data_revisao?: string | null
          documento_id: string
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          responsavel?: string | null
          user_id: string
          versao_anterior?: string | null
          versao_nova: string
        }
        Update: {
          alteracoes?: string | null
          created_at?: string
          data_revisao?: string | null
          documento_id?: string
          empresa_id?: string | null
          id?: string
          motivo?: string | null
          responsavel?: string | null
          user_id?: string
          versao_anterior?: string | null
          versao_nova?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_versoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          aprovacao_hash: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          aprovador_nome: string | null
          codigo: string
          created_at: string
          data_revisao: string | null
          documento_pai_id: string | null
          empresa_id: string | null
          id: string
          motivo_revisao: string | null
          nome: string
          proxima_revisao: string | null
          responsavel: string | null
          status: string | null
          updated_at: string
          user_id: string
          validade_revisao: string | null
          versao: string | null
          workflow_status: string
        }
        Insert: {
          aprovacao_hash?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          aprovador_nome?: string | null
          codigo: string
          created_at?: string
          data_revisao?: string | null
          documento_pai_id?: string | null
          empresa_id?: string | null
          id?: string
          motivo_revisao?: string | null
          nome: string
          proxima_revisao?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          validade_revisao?: string | null
          versao?: string | null
          workflow_status?: string
        }
        Update: {
          aprovacao_hash?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          aprovador_nome?: string | null
          codigo?: string
          created_at?: string
          data_revisao?: string | null
          documento_pai_id?: string | null
          empresa_id?: string | null
          id?: string
          motivo_revisao?: string | null
          nome?: string
          proxima_revisao?: string | null
          responsavel?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          validade_revisao?: string | null
          versao?: string | null
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_documento_pai_id_fkey"
            columns: ["documento_pai_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_bpf: {
        Row: {
          arquivo_nome: string
          arquivo_path: string
          created_at: string
          data_documento: string | null
          descricao: string | null
          empresa_id: string
          id: string
          pop_codigo: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome: string
          arquivo_path: string
          created_at?: string
          data_documento?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          pop_codigo?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string
          arquivo_path?: string
          created_at?: string
          data_documento?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          pop_codigo?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_bpf_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      empresa_membros: {
        Row: {
          ativo: boolean
          convidado_por: string | null
          created_at: string
          empresa_id: string
          id: string
          nome: string | null
          papel: Database["public"]["Enums"]["papel_empresa"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          convidado_por?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nome?: string | null
          papel?: Database["public"]["Enums"]["papel_empresa"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          convidado_por?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string | null
          papel?: Database["public"]["Enums"]["papel_empresa"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_membros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_modulos_custom: {
        Row: {
          ativado_por: string | null
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          modulo_codigo: string
          updated_at: string
        }
        Insert: {
          ativado_por?: string | null
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          modulo_codigo: string
          updated_at?: string
        }
        Update: {
          ativado_por?: string | null
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          modulo_codigo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_modulos_custom_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_pin: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          atividades_sipeagro: string[] | null
          autorizacao_medicamentos: string | null
          capacidade: string | null
          cnpj: string | null
          created_at: string
          crmv: string | null
          endereco: string | null
          id: string
          nome: string
          numero_sipeagro: string | null
          origem_agua: string | null
          prefixo_doc: string | null
          responsavel_tecnico: string | null
          tipo_producao: string[] | null
          updated_at: string
          user_id: string
          validade_autorizacao_medicamentos: string | null
          validade_registro_sipeagro: string | null
        }
        Insert: {
          atividades_sipeagro?: string[] | null
          autorizacao_medicamentos?: string | null
          capacidade?: string | null
          cnpj?: string | null
          created_at?: string
          crmv?: string | null
          endereco?: string | null
          id?: string
          nome: string
          numero_sipeagro?: string | null
          origem_agua?: string | null
          prefixo_doc?: string | null
          responsavel_tecnico?: string | null
          tipo_producao?: string[] | null
          updated_at?: string
          user_id: string
          validade_autorizacao_medicamentos?: string | null
          validade_registro_sipeagro?: string | null
        }
        Update: {
          atividades_sipeagro?: string[] | null
          autorizacao_medicamentos?: string | null
          capacidade?: string | null
          cnpj?: string | null
          created_at?: string
          crmv?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          numero_sipeagro?: string | null
          origem_agua?: string | null
          prefixo_doc?: string | null
          responsavel_tecnico?: string | null
          tipo_producao?: string[] | null
          updated_at?: string
          user_id?: string
          validade_autorizacao_medicamentos?: string | null
          validade_registro_sipeagro?: string | null
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          codigo: string | null
          created_at: string
          data_aquisicao: string | null
          empresa_id: string | null
          fabricante: string | null
          id: string
          modelo: string | null
          nome: string
          periodicidade_manutencao: string | null
          requisitos_manutencao: string | null
          serie: string | null
          setor: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          data_aquisicao?: string | null
          empresa_id?: string | null
          fabricante?: string | null
          id?: string
          modelo?: string | null
          nome: string
          periodicidade_manutencao?: string | null
          requisitos_manutencao?: string | null
          serie?: string | null
          setor?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          data_aquisicao?: string | null
          empresa_id?: string | null
          fabricante?: string | null
          id?: string
          modelo?: string | null
          nome?: string
          periodicidade_manutencao?: string | null
          requisitos_manutencao?: string | null
          serie?: string | null
          setor?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      execucao_pop_carimbos: {
        Row: {
          carimbo_data: string
          created_at: string
          empresa_id: string | null
          execucao_id: string
          hash_sha256: string
          id: string
          ip_address: string | null
          operador_nome: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          carimbo_data?: string
          created_at?: string
          empresa_id?: string | null
          execucao_id: string
          hash_sha256: string
          id?: string
          ip_address?: string | null
          operador_nome: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          carimbo_data?: string
          created_at?: string
          empresa_id?: string | null
          execucao_id?: string
          hash_sha256?: string
          id?: string
          ip_address?: string | null
          operador_nome?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_execucao_pop_carimbos_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      execucao_pops: {
        Row: {
          checklist_auditoria_ref: string | null
          codigo_pop: string
          created_at: string
          data_execucao: string
          data_verificacao: string | null
          documento_id: string | null
          empresa_id: string | null
          executor: string
          id: string
          it_codigo: string | null
          modelo_id: string | null
          nome_pop: string
          observacoes: string | null
          setor: string | null
          status: string | null
          status_verificacao: string | null
          user_id: string
          valores: Json
          verificado_por: string | null
        }
        Insert: {
          checklist_auditoria_ref?: string | null
          codigo_pop: string
          created_at?: string
          data_execucao?: string
          data_verificacao?: string | null
          documento_id?: string | null
          empresa_id?: string | null
          executor: string
          id?: string
          it_codigo?: string | null
          modelo_id?: string | null
          nome_pop: string
          observacoes?: string | null
          setor?: string | null
          status?: string | null
          status_verificacao?: string | null
          user_id: string
          valores?: Json
          verificado_por?: string | null
        }
        Update: {
          checklist_auditoria_ref?: string | null
          codigo_pop?: string
          created_at?: string
          data_execucao?: string
          data_verificacao?: string | null
          documento_id?: string | null
          empresa_id?: string | null
          executor?: string
          id?: string
          it_codigo?: string | null
          modelo_id?: string | null
          nome_pop?: string
          observacoes?: string | null
          setor?: string | null
          status?: string | null
          status_verificacao?: string | null
          user_id?: string
          valores?: Json
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execucao_pops_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucao_pops_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucao_pops_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos_bpf"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_itens: {
        Row: {
          assinatura_data: string | null
          codigo_produto: string | null
          created_at: string
          empresa_id: string | null
          expedicao_id: string
          id: string
          lote_produto: string | null
          observacoes: string | null
          operador_nome: string | null
          pin_hash_confirmacao: string | null
          produto: string
          quantidade: number
          quantidade_sacos: number | null
          rastreabilidade_id: string | null
          unidade: string | null
          user_id: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          assinatura_data?: string | null
          codigo_produto?: string | null
          created_at?: string
          empresa_id?: string | null
          expedicao_id: string
          id?: string
          lote_produto?: string | null
          observacoes?: string | null
          operador_nome?: string | null
          pin_hash_confirmacao?: string | null
          produto: string
          quantidade?: number
          quantidade_sacos?: number | null
          rastreabilidade_id?: string | null
          unidade?: string | null
          user_id: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          assinatura_data?: string | null
          codigo_produto?: string | null
          created_at?: string
          empresa_id?: string | null
          expedicao_id?: string
          id?: string
          lote_produto?: string | null
          observacoes?: string | null
          operador_nome?: string | null
          pin_hash_confirmacao?: string | null
          produto?: string
          quantidade?: number
          quantidade_sacos?: number | null
          rastreabilidade_id?: string | null
          unidade?: string | null
          user_id?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_itens_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicoes: {
        Row: {
          assinatura_data: string | null
          chave_acesso: string | null
          cliente_cep: string | null
          cliente_cidade: string | null
          cliente_cnpj: string | null
          cliente_endereco: string | null
          cliente_ie: string | null
          cliente_nome: string
          cliente_telefone: string | null
          cliente_uf: string | null
          comprovante_arquivo_nome: string | null
          comprovante_arquivo_path: string | null
          created_at: string
          data_emissao: string | null
          data_saida: string | null
          empresa_id: string | null
          id: string
          motorista_cpf: string | null
          motorista_nome: string | null
          numero_nf: string
          observacoes: string | null
          operador_nome: string | null
          origem: string
          peso_bruto_kg: number | null
          peso_liquido_kg: number | null
          pin_hash_confirmacao: string | null
          serie_nf: string | null
          status: string
          sync_origem: string
          transportadora_cnpj: string | null
          transportadora_nome: string | null
          updated_at: string
          user_id: string
          valor_total: number | null
          veiculo_placa: string | null
          veiculo_uf: string | null
          xml_content: string | null
        }
        Insert: {
          assinatura_data?: string | null
          chave_acesso?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cnpj?: string | null
          cliente_endereco?: string | null
          cliente_ie?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          cliente_uf?: string | null
          comprovante_arquivo_nome?: string | null
          comprovante_arquivo_path?: string | null
          created_at?: string
          data_emissao?: string | null
          data_saida?: string | null
          empresa_id?: string | null
          id?: string
          motorista_cpf?: string | null
          motorista_nome?: string | null
          numero_nf: string
          observacoes?: string | null
          operador_nome?: string | null
          origem?: string
          peso_bruto_kg?: number | null
          peso_liquido_kg?: number | null
          pin_hash_confirmacao?: string | null
          serie_nf?: string | null
          status?: string
          sync_origem?: string
          transportadora_cnpj?: string | null
          transportadora_nome?: string | null
          updated_at?: string
          user_id: string
          valor_total?: number | null
          veiculo_placa?: string | null
          veiculo_uf?: string | null
          xml_content?: string | null
        }
        Update: {
          assinatura_data?: string | null
          chave_acesso?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cnpj?: string | null
          cliente_endereco?: string | null
          cliente_ie?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          cliente_uf?: string | null
          comprovante_arquivo_nome?: string | null
          comprovante_arquivo_path?: string | null
          created_at?: string
          data_emissao?: string | null
          data_saida?: string | null
          empresa_id?: string | null
          id?: string
          motorista_cpf?: string | null
          motorista_nome?: string | null
          numero_nf?: string
          observacoes?: string | null
          operador_nome?: string | null
          origem?: string
          peso_bruto_kg?: number | null
          peso_liquido_kg?: number | null
          pin_hash_confirmacao?: string | null
          serie_nf?: string | null
          status?: string
          sync_origem?: string
          transportadora_cnpj?: string | null
          transportadora_nome?: string | null
          updated_at?: string
          user_id?: string
          valor_total?: number | null
          veiculo_placa?: string | null
          veiculo_uf?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_ingredientes: {
        Row: {
          created_at: string
          empresa_id: string | null
          formula_id: string
          id: string
          materia_prima: string
          observacoes: string | null
          ordem: number
          quantidade_kg: number
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          formula_id: string
          id?: string
          materia_prima: string
          observacoes?: string | null
          ordem?: number
          quantidade_kg?: number
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          formula_id?: string
          id?: string
          materia_prima?: string
          observacoes?: string | null
          ordem?: number
          quantidade_kg?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formula_ingredientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formula_ingredientes_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "formulas"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_itens: {
        Row: {
          created_at: string
          empresa_id: string | null
          fornecedor: string | null
          id: string
          lote_mp: string | null
          materia_prima: string
          ordem_id: string
          percentual: string | null
          quantidade_formula: string | null
          unidade: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          lote_mp?: string | null
          materia_prima: string
          ordem_id: string
          percentual?: string | null
          quantidade_formula?: string | null
          unidade?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          fornecedor?: string | null
          id?: string
          lote_mp?: string | null
          materia_prima?: string
          ordem_id?: string
          percentual?: string | null
          quantidade_formula?: string | null
          unidade?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formula_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formula_itens_ordem_id_fkey"
            columns: ["ordem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      formulas: {
        Row: {
          codigo: string
          created_at: string
          data_versao: string
          empresa_id: string | null
          id: string
          observacoes: string | null
          produto_id: string | null
          produto_nome: string
          status: string
          updated_at: string
          user_id: string
          versao: string
        }
        Insert: {
          codigo: string
          created_at?: string
          data_versao?: string
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          produto_id?: string | null
          produto_nome: string
          status?: string
          updated_at?: string
          user_id: string
          versao?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          data_versao?: string
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          produto_id?: string | null
          produto_nome?: string
          status?: string
          updated_at?: string
          user_id?: string
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "formulas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedor_auditorias: {
        Row: {
          auditor: string
          created_at: string
          data_auditoria: string
          empresa_id: string | null
          fornecedor_id: string
          id: string
          itens_auditoria: Json | null
          observacoes: string | null
          pontuacao_obtida: number | null
          status: string | null
          tipo_auditoria: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auditor: string
          created_at?: string
          data_auditoria?: string
          empresa_id?: string | null
          fornecedor_id: string
          id?: string
          itens_auditoria?: Json | null
          observacoes?: string | null
          pontuacao_obtida?: number | null
          status?: string | null
          tipo_auditoria: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auditor?: string
          created_at?: string
          data_auditoria?: string
          empresa_id?: string | null
          fornecedor_id?: string
          id?: string
          itens_auditoria?: Json | null
          observacoes?: string | null
          pontuacao_obtida?: number | null
          status?: string | null
          tipo_auditoria?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_auditorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedor_auditorias_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato: string | null
          contato_comercial: string | null
          contato_comercial_tel_email: string | null
          contato_qualidade: string | null
          contato_qualidade_tel_email: string | null
          created_at: string
          data_verificacao: string | null
          doc_alvara_funcionamento: boolean | null
          doc_certificado_analise: boolean | null
          doc_certificado_registro_mapa: boolean | null
          doc_certificado_registro_produto: boolean | null
          doc_ficha_tecnica: boolean | null
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          nome: string
          nota_avaliacao: number | null
          observacoes: string | null
          produtos_fornecidos: string | null
          proxima_avaliacao: string | null
          registro_mapa: string | null
          registro_sipeagro: string | null
          resultado_qualificacao: string | null
          sipeagro_data_verificacao: string | null
          sipeagro_verificado: boolean | null
          status_qualificacao: string | null
          status_verificacao: string | null
          tipo_produto: string | null
          ultima_avaliacao: string | null
          updated_at: string
          user_id: string
          verificado_por: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          contato_comercial?: string | null
          contato_comercial_tel_email?: string | null
          contato_qualidade?: string | null
          contato_qualidade_tel_email?: string | null
          created_at?: string
          data_verificacao?: string | null
          doc_alvara_funcionamento?: boolean | null
          doc_certificado_analise?: boolean | null
          doc_certificado_registro_mapa?: boolean | null
          doc_certificado_registro_produto?: boolean | null
          doc_ficha_tecnica?: boolean | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome: string
          nota_avaliacao?: number | null
          observacoes?: string | null
          produtos_fornecidos?: string | null
          proxima_avaliacao?: string | null
          registro_mapa?: string | null
          registro_sipeagro?: string | null
          resultado_qualificacao?: string | null
          sipeagro_data_verificacao?: string | null
          sipeagro_verificado?: boolean | null
          status_qualificacao?: string | null
          status_verificacao?: string | null
          tipo_produto?: string | null
          ultima_avaliacao?: string | null
          updated_at?: string
          user_id: string
          verificado_por?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato?: string | null
          contato_comercial?: string | null
          contato_comercial_tel_email?: string | null
          contato_qualidade?: string | null
          contato_qualidade_tel_email?: string | null
          created_at?: string
          data_verificacao?: string | null
          doc_alvara_funcionamento?: boolean | null
          doc_certificado_analise?: boolean | null
          doc_certificado_registro_mapa?: boolean | null
          doc_certificado_registro_produto?: boolean | null
          doc_ficha_tecnica?: boolean | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          nome?: string
          nota_avaliacao?: number | null
          observacoes?: string | null
          produtos_fornecidos?: string | null
          proxima_avaliacao?: string | null
          registro_mapa?: string | null
          registro_sipeagro?: string | null
          resultado_qualificacao?: string | null
          sipeagro_data_verificacao?: string | null
          sipeagro_verificado?: boolean | null
          status_qualificacao?: string | null
          status_verificacao?: string | null
          tipo_produto?: string | null
          ultima_avaliacao?: string | null
          updated_at?: string
          user_id?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      heartbeat: {
        Row: {
          id: number
          last_ping: string | null
        }
        Insert: {
          id?: number
          last_ping?: string | null
        }
        Update: {
          id?: number
          last_ping?: string | null
        }
        Relationships: []
      }
      indicacoes: {
        Row: {
          cadastrou_em: string | null
          codigo_referral: string
          converteu_em: string | null
          criado_em: string
          id: string
          indicado_email: string | null
          indicado_user_id: string | null
          indicador_user_id: string
          observacoes: string | null
          produto: string | null
          recompensa_creditada: boolean | null
          recompensa_valor: number | null
          status: string
        }
        Insert: {
          cadastrou_em?: string | null
          codigo_referral: string
          converteu_em?: string | null
          criado_em?: string
          id?: string
          indicado_email?: string | null
          indicado_user_id?: string | null
          indicador_user_id: string
          observacoes?: string | null
          produto?: string | null
          recompensa_creditada?: boolean | null
          recompensa_valor?: number | null
          status?: string
        }
        Update: {
          cadastrou_em?: string | null
          codigo_referral?: string
          converteu_em?: string | null
          criado_em?: string
          id?: string
          indicado_email?: string | null
          indicado_user_id?: string | null
          indicador_user_id?: string
          observacoes?: string | null
          produto?: string | null
          recompensa_creditada?: boolean | null
          recompensa_valor?: number | null
          status?: string
        }
        Relationships: []
      }
      inspecoes_iscas: {
        Row: {
          acao_tomada: string | null
          created_at: string
          data_inspecao: string
          empresa_id: string | null
          foto_url: string | null
          id: string
          observacoes: string | null
          ponto_id: string
          presenca_pragas: boolean | null
          responsavel: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acao_tomada?: string | null
          created_at?: string
          data_inspecao?: string
          empresa_id?: string | null
          foto_url?: string | null
          id?: string
          observacoes?: string | null
          ponto_id: string
          presenca_pragas?: boolean | null
          responsavel?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acao_tomada?: string | null
          created_at?: string
          data_inspecao?: string
          empresa_id?: string | null
          foto_url?: string | null
          id?: string
          observacoes?: string | null
          ponto_id?: string
          presenca_pragas?: boolean | null
          responsavel?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_iscas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspecoes_iscas_ponto_id_fkey"
            columns: ["ponto_id"]
            isOneToOne: false
            referencedRelation: "mapa_iscas_armadilhas"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_utm: {
        Row: {
          created_at: string
          email: string | null
          id: string
          landing_page: string | null
          lead_id: string | null
          lead_origem: string | null
          referrer: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          landing_page?: string | null
          lead_id?: string | null
          lead_origem?: string | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          landing_page?: string | null
          lead_id?: string | null
          lead_origem?: string | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          notificado: boolean
          origem: string | null
          produto_interesse: string | null
          telefone: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          notificado?: boolean
          origem?: string | null
          produto_interesse?: string | null
          telefone: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          notificado?: boolean
          origem?: string | null
          produto_interesse?: string | null
          telefone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      leads_contato: {
        Row: {
          cidade: string | null
          created_at: string
          email: string
          estado: string | null
          id: string
          mensagem: string | null
          nome: string
          programa: string | null
          status: string
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email: string
          estado?: string | null
          id?: string
          mensagem?: string | null
          nome: string
          programa?: string | null
          status?: string
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string
          estado?: string | null
          id?: string
          mensagem?: string | null
          nome?: string
          programa?: string | null
          status?: string
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      legislacao_alertas: {
        Row: {
          created_at: string
          data_publicacao: string | null
          empresa_id: string | null
          fonte: string | null
          id: string
          lido: boolean | null
          relevancia: string | null
          resumo: string
          tipo: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          fonte?: string | null
          id?: string
          lido?: boolean | null
          relevancia?: string | null
          resumo: string
          tipo?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          fonte?: string | null
          id?: string
          lido?: boolean | null
          relevancia?: string | null
          resumo?: string
          tipo?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legislacao_alertas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      licenca_empresas: {
        Row: {
          ativo: boolean
          desvinculado_em: string | null
          empresa_id: string
          excedente: boolean
          id: string
          licenca_id: string
          stripe_invoice_id: string | null
          user_id: string
          vinculado_em: string
        }
        Insert: {
          ativo?: boolean
          desvinculado_em?: string | null
          empresa_id: string
          excedente?: boolean
          id?: string
          licenca_id: string
          stripe_invoice_id?: string | null
          user_id: string
          vinculado_em?: string
        }
        Update: {
          ativo?: boolean
          desvinculado_em?: string | null
          empresa_id?: string
          excedente?: boolean
          id?: string
          licenca_id?: string
          stripe_invoice_id?: string | null
          user_id?: string
          vinculado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenca_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenca_empresas_licenca_id_fkey"
            columns: ["licenca_id"]
            isOneToOne: false
            referencedRelation: "licencas"
            referencedColumns: ["id"]
          },
        ]
      }
      licencas: {
        Row: {
          chave_licenca: string
          created_at: string
          data_expiracao: string
          data_inicio: string
          empresa_id: string | null
          id: string
          liberado_admin: boolean
          nivel: string
          plano: string
          produto: string
          slots_max: number
          slots_usados: number
          status: string
          stripe_checkout_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chave_licenca: string
          created_at?: string
          data_expiracao: string
          data_inicio?: string
          empresa_id?: string | null
          id?: string
          liberado_admin?: boolean
          nivel?: string
          plano?: string
          produto?: string
          slots_max?: number
          slots_usados?: number
          status?: string
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chave_licenca?: string
          created_at?: string
          data_expiracao?: string
          data_inicio?: string
          empresa_id?: string | null
          id?: string
          liberado_admin?: boolean
          nivel?: string
          plano?: string
          produto?: string
          slots_max?: number
          slots_usados?: number
          status?: string
          stripe_checkout_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licencas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      manuais_bpf: {
        Row: {
          arquivo_nome: string | null
          arquivo_path: string | null
          conteudo: string
          created_at: string
          empresa_id: string | null
          gerado_por_nome: string | null
          hash_sha256: string
          id: string
          observacoes: string | null
          resp_legal_assinado_em: string | null
          resp_legal_hash: string | null
          resp_legal_nome: string | null
          resp_legal_user_id: string | null
          resp_tecnico_assinado_em: string | null
          resp_tecnico_crmv: string | null
          resp_tecnico_hash: string | null
          resp_tecnico_nome: string | null
          resp_tecnico_user_id: string | null
          status: string
          titulo: string
          total_calibracoes: number
          total_documentos: number
          total_fornecedores: number
          total_its: number
          total_pops: number
          total_produtos: number
          updated_at: string
          user_id: string
          versao: number
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          conteudo: string
          created_at?: string
          empresa_id?: string | null
          gerado_por_nome?: string | null
          hash_sha256: string
          id?: string
          observacoes?: string | null
          resp_legal_assinado_em?: string | null
          resp_legal_hash?: string | null
          resp_legal_nome?: string | null
          resp_legal_user_id?: string | null
          resp_tecnico_assinado_em?: string | null
          resp_tecnico_crmv?: string | null
          resp_tecnico_hash?: string | null
          resp_tecnico_nome?: string | null
          resp_tecnico_user_id?: string | null
          status?: string
          titulo?: string
          total_calibracoes?: number
          total_documentos?: number
          total_fornecedores?: number
          total_its?: number
          total_pops?: number
          total_produtos?: number
          updated_at?: string
          user_id: string
          versao?: number
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          conteudo?: string
          created_at?: string
          empresa_id?: string | null
          gerado_por_nome?: string | null
          hash_sha256?: string
          id?: string
          observacoes?: string | null
          resp_legal_assinado_em?: string | null
          resp_legal_hash?: string | null
          resp_legal_nome?: string | null
          resp_legal_user_id?: string | null
          resp_tecnico_assinado_em?: string | null
          resp_tecnico_crmv?: string | null
          resp_tecnico_hash?: string | null
          resp_tecnico_nome?: string | null
          resp_tecnico_user_id?: string | null
          status?: string
          titulo?: string
          total_calibracoes?: number
          total_documentos?: number
          total_fornecedores?: number
          total_its?: number
          total_pops?: number
          total_produtos?: number
          updated_at?: string
          user_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_manuais_bpf_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          codigo_equipamento: string | null
          created_at: string
          custo: string | null
          data_execucao: string | null
          data_programada: string | null
          descricao: string
          empresa_id: string | null
          equipamento: string
          id: string
          observacoes: string | null
          pecas_trocadas: string | null
          proxima_manutencao: string | null
          responsavel: string | null
          status: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo_equipamento?: string | null
          created_at?: string
          custo?: string | null
          data_execucao?: string | null
          data_programada?: string | null
          descricao: string
          empresa_id?: string | null
          equipamento: string
          id?: string
          observacoes?: string | null
          pecas_trocadas?: string | null
          proxima_manutencao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo_equipamento?: string | null
          created_at?: string
          custo?: string | null
          data_execucao?: string | null
          data_programada?: string | null
          descricao?: string
          empresa_id?: string | null
          equipamento?: string
          id?: string
          observacoes?: string | null
          pecas_trocadas?: string | null
          proxima_manutencao?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mapa_estabelecimentos: {
        Row: {
          atividade: string | null
          categoria: string | null
          cep: string | null
          cnpj: string | null
          created_at: string
          dados_brutos: Json
          data_atualizacao_fonte: string | null
          data_registro: string | null
          endereco: string | null
          fonte_linha_id: string | null
          id: string
          importacao_id: string | null
          importado_em: string
          municipio: string | null
          nome_fantasia: string | null
          razao_social: string
          registro_estabelecimento: string | null
          situacao: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          atividade?: string | null
          categoria?: string | null
          cep?: string | null
          cnpj?: string | null
          created_at?: string
          dados_brutos?: Json
          data_atualizacao_fonte?: string | null
          data_registro?: string | null
          endereco?: string | null
          fonte_linha_id?: string | null
          id?: string
          importacao_id?: string | null
          importado_em?: string
          municipio?: string | null
          nome_fantasia?: string | null
          razao_social: string
          registro_estabelecimento?: string | null
          situacao?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          atividade?: string | null
          categoria?: string | null
          cep?: string | null
          cnpj?: string | null
          created_at?: string
          dados_brutos?: Json
          data_atualizacao_fonte?: string | null
          data_registro?: string | null
          endereco?: string | null
          fonte_linha_id?: string | null
          id?: string
          importacao_id?: string | null
          importado_em?: string
          municipio?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          registro_estabelecimento?: string | null
          situacao?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapa_estabelecimentos_importacao_id_fkey"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "mapa_importacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mapa_importacoes: {
        Row: {
          arquivo_nome: string
          concluido_em: string | null
          created_at: string
          id: string
          imported_by: string
          observacoes: string | null
          status: string
          total_importadas: number
          total_linhas: number
          total_rejeitadas: number
          updated_at: string
        }
        Insert: {
          arquivo_nome: string
          concluido_em?: string | null
          created_at?: string
          id?: string
          imported_by: string
          observacoes?: string | null
          status?: string
          total_importadas?: number
          total_linhas?: number
          total_rejeitadas?: number
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string
          concluido_em?: string | null
          created_at?: string
          id?: string
          imported_by?: string
          observacoes?: string | null
          status?: string
          total_importadas?: number
          total_linhas?: number
          total_rejeitadas?: number
          updated_at?: string
        }
        Relationships: []
      }
      mapa_iscas_armadilhas: {
        Row: {
          ativo: boolean
          codigo: string
          coordenadas: string | null
          created_at: string
          empresa_id: string | null
          id: string
          localizacao: string
          observacoes: string | null
          periodicidade_dias: number | null
          produto_quimico_id: string | null
          setor: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          coordenadas?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          localizacao: string
          observacoes?: string | null
          periodicidade_dias?: number | null
          produto_quimico_id?: string | null
          setor?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          coordenadas?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          localizacao?: string
          observacoes?: string | null
          periodicidade_dias?: number | null
          produto_quimico_id?: string | null
          setor?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapa_iscas_armadilhas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_risco: {
        Row: {
          created_at: string
          empresa_id: string | null
          etapa_processo: string
          id: string
          medidas_controle: string | null
          nivel_risco: string
          perigo_identificado: string
          probabilidade: string
          severidade: string
          tipo_perigo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          etapa_processo: string
          id?: string
          medidas_controle?: string | null
          nivel_risco?: string
          perigo_identificado: string
          probabilidade?: string
          severidade?: string
          tipo_perigo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          etapa_processo?: string
          id?: string
          medidas_controle?: string | null
          nivel_risco?: string
          perigo_identificado?: string
          probabilidade?: string
          severidade?: string
          tipo_perigo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriz_risco_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_sensibilidade: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          produto_anterior: string
          produto_seguinte: string
          requer_flushing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          produto_anterior: string
          produto_seguinte: string
          requer_flushing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          produto_anterior?: string
          produto_seguinte?: string
          requer_flushing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriz_sensibilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_acesso: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          senha_hash: string
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          senha_hash: string
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          senha_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      modelos_bpf: {
        Row: {
          base_legal: string | null
          conteudo: Json
          created_at: string
          empresa_id: string
          frequencia: string | null
          id: string
          it_codigo: string
          objetivo: string | null
          pop_codigo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_legal?: string | null
          conteudo?: Json
          created_at?: string
          empresa_id: string
          frequencia?: string | null
          id?: string
          it_codigo: string
          objetivo?: string | null
          pop_codigo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_legal?: string | null
          conteudo?: Json
          created_at?: string
          empresa_id?: string
          frequencia?: string | null
          id?: string
          it_codigo?: string
          objetivo?: string | null
          pop_codigo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      modelos_empresa: {
        Row: {
          arquivo_referencia_nome: string | null
          arquivo_referencia_path: string | null
          ativo: boolean
          campos: Json
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          pop_codigo: string | null
          updated_at: string
          user_id: string
          webhook_token: string | null
        }
        Insert: {
          arquivo_referencia_nome?: string | null
          arquivo_referencia_path?: string | null
          ativo?: boolean
          campos?: Json
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          pop_codigo?: string | null
          updated_at?: string
          user_id: string
          webhook_token?: string | null
        }
        Update: {
          arquivo_referencia_nome?: string | null
          arquivo_referencia_path?: string | null
          ativo?: boolean
          campos?: Json
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          pop_codigo?: string | null
          updated_at?: string
          user_id?: string
          webhook_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modelos_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoramento_pcc: {
        Row: {
          acao_corretiva: string | null
          conformidade: boolean | null
          created_at: string
          data: string
          data_verificacao: string | null
          empresa_id: string | null
          id: string
          limite_critico: string | null
          observacoes: string | null
          parametro: string
          ponto_critico: string
          responsavel: string
          status_verificacao: string | null
          updated_at: string
          user_id: string
          valor_encontrado: string
          verificado_por: string | null
        }
        Insert: {
          acao_corretiva?: string | null
          conformidade?: boolean | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          limite_critico?: string | null
          observacoes?: string | null
          parametro: string
          ponto_critico: string
          responsavel: string
          status_verificacao?: string | null
          updated_at?: string
          user_id: string
          valor_encontrado: string
          verificado_por?: string | null
        }
        Update: {
          acao_corretiva?: string | null
          conformidade?: boolean | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          limite_critico?: string | null
          observacoes?: string | null
          parametro?: string
          ponto_critico?: string
          responsavel?: string
          status_verificacao?: string | null
          updated_at?: string
          user_id?: string
          valor_encontrado?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoramento_pcc_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      nao_conformidades: {
        Row: {
          acao_corretiva: string | null
          acao_preventiva: string | null
          causa: string | null
          created_at: string
          data: string
          data_verificacao: string | null
          descricao: string
          empresa_id: string | null
          id: string
          prazo: string | null
          responsavel: string | null
          setor: string
          status: string | null
          updated_at: string
          user_id: string
          verificacao_eficacia: string | null
        }
        Insert: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          causa?: string | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          descricao: string
          empresa_id?: string | null
          id?: string
          prazo?: string | null
          responsavel?: string | null
          setor: string
          status?: string | null
          updated_at?: string
          user_id: string
          verificacao_eficacia?: string | null
        }
        Update: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          causa?: string | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          descricao?: string
          empresa_id?: string | null
          id?: string
          prazo?: string | null
          responsavel?: string | null
          setor?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          verificacao_eficacia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nao_conformidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      normas_legislacao: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          codigo: string | null
          created_at: string
          data_publicacao: string | null
          empresa_id: string | null
          id: string
          orgao: string | null
          resumo: string | null
          tags: string[] | null
          tipo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          codigo?: string | null
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          id?: string
          orgao?: string | null
          resumo?: string | null
          tags?: string[] | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          codigo?: string | null
          created_at?: string
          data_publicacao?: string | null
          empresa_id?: string | null
          id?: string
          orgao?: string | null
          resumo?: string | null
          tags?: string[] | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "normas_legislacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_admin: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          lida_em: string | null
          link: string | null
          mensagem: string | null
          metadata: Json | null
          prioridade: string
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          prioridade?: string
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          metadata?: Json | null
          prioridade?: string
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notificacoes_preferencias: {
        Row: {
          canais: Json
          created_at: string
          horario_silencio_fim: string | null
          horario_silencio_inicio: string | null
          id: string
          tipos_habilitados: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          canais?: Json
          created_at?: string
          horario_silencio_fim?: string | null
          horario_silencio_inicio?: string | null
          id?: string
          tipos_habilitados?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          canais?: Json
          created_at?: string
          horario_silencio_fim?: string | null
          horario_silencio_inicio?: string | null
          id?: string
          tipos_habilitados?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutricrm_projetos: {
        Row: {
          anexos: string[] | null
          cliente_nome: string
          created_at: string | null
          descricao: string | null
          empresa_id: string
          id: string
          status: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          anexos?: string[] | null
          cliente_nome: string
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          status?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          anexos?: string[] | null
          cliente_nome?: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          status?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutricrm_projetos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progresso: {
        Row: {
          checklist_completo: boolean | null
          concluido_em: string | null
          id: string
          passos_concluidos: Json
          primeiro_acesso_em: string
          produto: string
          tour_completo: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist_completo?: boolean | null
          concluido_em?: string | null
          id?: string
          passos_concluidos?: Json
          primeiro_acesso_em?: string
          produto: string
          tour_completo?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist_completo?: boolean | null
          concluido_em?: string | null
          id?: string
          passos_concluidos?: Json
          primeiro_acesso_em?: string
          produto?: string
          tour_completo?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ordens_producao: {
        Row: {
          created_at: string
          data_programada: string
          destino_sobra: string | null
          empresa_id: string | null
          formula_id: string | null
          formula_nome: string
          id: string
          local_armazenamento: string | null
          lote_produto: string | null
          material_flushing: string | null
          motivo_retrabalho: string | null
          necessita_flushing: boolean | null
          numero_batidas: number | null
          numero_ordem: string
          observacoes: string | null
          ordem_origem_id: string | null
          peso_por_batida: string | null
          prioridade: string | null
          produto: string
          proximo_produto: string | null
          quantidade_programada: string | null
          quantidade_sacos: number | null
          quantidade_sobra: string | null
          sequencia_producao: number | null
          status: string | null
          tempo_mistura_padrao_minutos: number | null
          tipo_embalagem: string | null
          tipo_ordem: string
          unidade: string | null
          updated_at: string
          user_id: string
          verificacao_data: string | null
          verificacao_responsavel: string | null
          volume_misturador_kg: number | null
        }
        Insert: {
          created_at?: string
          data_programada?: string
          destino_sobra?: string | null
          empresa_id?: string | null
          formula_id?: string | null
          formula_nome?: string
          id?: string
          local_armazenamento?: string | null
          lote_produto?: string | null
          material_flushing?: string | null
          motivo_retrabalho?: string | null
          necessita_flushing?: boolean | null
          numero_batidas?: number | null
          numero_ordem: string
          observacoes?: string | null
          ordem_origem_id?: string | null
          peso_por_batida?: string | null
          prioridade?: string | null
          produto: string
          proximo_produto?: string | null
          quantidade_programada?: string | null
          quantidade_sacos?: number | null
          quantidade_sobra?: string | null
          sequencia_producao?: number | null
          status?: string | null
          tempo_mistura_padrao_minutos?: number | null
          tipo_embalagem?: string | null
          tipo_ordem?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
          verificacao_data?: string | null
          verificacao_responsavel?: string | null
          volume_misturador_kg?: number | null
        }
        Update: {
          created_at?: string
          data_programada?: string
          destino_sobra?: string | null
          empresa_id?: string | null
          formula_id?: string | null
          formula_nome?: string
          id?: string
          local_armazenamento?: string | null
          lote_produto?: string | null
          material_flushing?: string | null
          motivo_retrabalho?: string | null
          necessita_flushing?: boolean | null
          numero_batidas?: number | null
          numero_ordem?: string
          observacoes?: string | null
          ordem_origem_id?: string | null
          peso_por_batida?: string | null
          prioridade?: string | null
          produto?: string
          proximo_produto?: string | null
          quantidade_programada?: string | null
          quantidade_sacos?: number | null
          quantidade_sobra?: string | null
          sequencia_producao?: number | null
          status?: string | null
          tempo_mistura_padrao_minutos?: number | null
          tipo_embalagem?: string | null
          tipo_ordem?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
          verificacao_data?: string | null
          verificacao_responsavel?: string | null
          volume_misturador_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "formulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_ordem_origem_id_fkey"
            columns: ["ordem_origem_id"]
            isOneToOne: false
            referencedRelation: "ordens_producao"
            referencedColumns: ["id"]
          },
        ]
      }
      pac_monitoramento: {
        Row: {
          acao_corretiva: string | null
          conformidade: boolean | null
          created_at: string
          data: string
          data_verificacao: string | null
          elemento_controle: string
          empresa_id: string | null
          id: string
          item_avaliado: string
          monitor: string
          resultado: string | null
          status_verificacao: string | null
          updated_at: string
          user_id: string
          verificado_por: string | null
        }
        Insert: {
          acao_corretiva?: string | null
          conformidade?: boolean | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          elemento_controle: string
          empresa_id?: string | null
          id?: string
          item_avaliado: string
          monitor: string
          resultado?: string | null
          status_verificacao?: string | null
          updated_at?: string
          user_id: string
          verificado_por?: string | null
        }
        Update: {
          acao_corretiva?: string | null
          conformidade?: boolean | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          elemento_controle?: string
          empresa_id?: string | null
          id?: string
          item_avaliado?: string
          monitor?: string
          resultado?: string | null
          status_verificacao?: string | null
          updated_at?: string
          user_id?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pac_monitoramento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_anual: {
        Row: {
          atividade: string
          categoria: string
          created_at: string
          descricao: string | null
          empresa_id: string | null
          frequencia: string
          id: string
          mes_inicio: number | null
          observacoes: string | null
          proxima_execucao: string | null
          quantidade_prevista: number | null
          responsavel: string | null
          status: string | null
          ultima_execucao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          atividade: string
          categoria?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          frequencia?: string
          id?: string
          mes_inicio?: number | null
          observacoes?: string | null
          proxima_execucao?: string | null
          quantidade_prevista?: number | null
          responsavel?: string | null
          status?: string | null
          ultima_execucao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          atividade?: string
          categoria?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          frequencia?: string
          id?: string
          mes_inicio?: number | null
          observacoes?: string | null
          proxima_execucao?: string | null
          quantidade_prevista?: number | null
          responsavel?: string | null
          status?: string | null
          ultima_execucao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_anual_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_planilha_itens: {
        Row: {
          area: string
          conforme: boolean | null
          created_at: string
          data_registro: string | null
          empresa_id: string | null
          funcao: string | null
          id: string
          observacoes: string | null
          periodo_label: string
          planilha_id: string
          responsavel: string | null
          user_id: string
        }
        Insert: {
          area: string
          conforme?: boolean | null
          created_at?: string
          data_registro?: string | null
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          observacoes?: string | null
          periodo_label: string
          planilha_id: string
          responsavel?: string | null
          user_id: string
        }
        Update: {
          area?: string
          conforme?: boolean | null
          created_at?: string
          data_registro?: string | null
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          observacoes?: string | null
          periodo_label?: string
          planilha_id?: string
          responsavel?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pop_planilha_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pop_planilha_itens_planilha_id_fkey"
            columns: ["planilha_id"]
            isOneToOne: false
            referencedRelation: "pop_planilhas"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_planilhas: {
        Row: {
          ano: number
          assinatura_executor: string | null
          assinatura_executor_data: string | null
          assinatura_rt: string | null
          assinatura_rt_crmv: string | null
          assinatura_rt_data: string | null
          assinatura_supervisor: string | null
          assinatura_supervisor_data: string | null
          created_at: string
          data_verificacao: string | null
          empresa_id: string | null
          id: string
          mes: number
          observacoes: string | null
          periodicidade: string
          pop_codigo: string
          pop_nome: string
          status: string | null
          updated_at: string
          user_id: string
          verificado_por: string | null
        }
        Insert: {
          ano: number
          assinatura_executor?: string | null
          assinatura_executor_data?: string | null
          assinatura_rt?: string | null
          assinatura_rt_crmv?: string | null
          assinatura_rt_data?: string | null
          assinatura_supervisor?: string | null
          assinatura_supervisor_data?: string | null
          created_at?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          mes: number
          observacoes?: string | null
          periodicidade?: string
          pop_codigo: string
          pop_nome: string
          status?: string | null
          updated_at?: string
          user_id: string
          verificado_por?: string | null
        }
        Update: {
          ano?: number
          assinatura_executor?: string | null
          assinatura_executor_data?: string | null
          assinatura_rt?: string | null
          assinatura_rt_crmv?: string | null
          assinatura_rt_data?: string | null
          assinatura_supervisor?: string | null
          assinatura_supervisor_data?: string | null
          created_at?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          id?: string
          mes?: number
          observacoes?: string | null
          periodicidade?: string
          pop_codigo?: string
          pop_nome?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pop_planilhas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      producao: {
        Row: {
          contraprova_local: string | null
          contraprova_quantidade: string | null
          contraprova_retida: boolean | null
          contraprova_validade: string | null
          created_at: string
          data: string
          empresa_id: string | null
          flush_produto_anterior: string | null
          flush_realizado: boolean | null
          flush_tipo: string | null
          flush_volume: string | null
          id: string
          lote: string | null
          operador: string | null
          produto: string
          quantidade: string | null
          tempo_mistura: string | null
          user_id: string
        }
        Insert: {
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          flush_produto_anterior?: string | null
          flush_realizado?: boolean | null
          flush_tipo?: string | null
          flush_volume?: string | null
          id?: string
          lote?: string | null
          operador?: string | null
          produto: string
          quantidade?: string | null
          tempo_mistura?: string | null
          user_id: string
        }
        Update: {
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          flush_produto_anterior?: string | null
          flush_realizado?: boolean | null
          flush_tipo?: string | null
          flush_volume?: string | null
          id?: string
          lote?: string | null
          operador?: string | null
          produto?: string
          quantidade?: string | null
          tempo_mistura?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          armazenamento: string | null
          categoria_animal: string | null
          classificacao: string
          composicao: string | null
          created_at: string
          diferenciais: string | null
          embalagem: string | null
          empresa_id: string | null
          especie_alvo: string | null
          especie_destino: string | null
          forma_fisica: string | null
          foto_url: string | null
          id: string
          indicacoes: string | null
          linha_compartilhada: boolean | null
          marca: string | null
          modo_preparo: string | null
          modo_uso: string | null
          niveis_garantia: Json | null
          nome: string
          observacoes: string | null
          peso_liquido: string | null
          precaucoes: string | null
          registro_mapa: string | null
          status: string | null
          unidade_peso: string | null
          updated_at: string
          user_id: string
          validade_meses: number | null
        }
        Insert: {
          armazenamento?: string | null
          categoria_animal?: string | null
          classificacao?: string
          composicao?: string | null
          created_at?: string
          diferenciais?: string | null
          embalagem?: string | null
          empresa_id?: string | null
          especie_alvo?: string | null
          especie_destino?: string | null
          forma_fisica?: string | null
          foto_url?: string | null
          id?: string
          indicacoes?: string | null
          linha_compartilhada?: boolean | null
          marca?: string | null
          modo_preparo?: string | null
          modo_uso?: string | null
          niveis_garantia?: Json | null
          nome: string
          observacoes?: string | null
          peso_liquido?: string | null
          precaucoes?: string | null
          registro_mapa?: string | null
          status?: string | null
          unidade_peso?: string | null
          updated_at?: string
          user_id: string
          validade_meses?: number | null
        }
        Update: {
          armazenamento?: string | null
          categoria_animal?: string | null
          classificacao?: string
          composicao?: string | null
          created_at?: string
          diferenciais?: string | null
          embalagem?: string | null
          empresa_id?: string | null
          especie_alvo?: string | null
          especie_destino?: string | null
          forma_fisica?: string | null
          foto_url?: string | null
          id?: string
          indicacoes?: string | null
          linha_compartilhada?: boolean | null
          marca?: string | null
          modo_preparo?: string | null
          modo_uso?: string | null
          niveis_garantia?: Json | null
          nome?: string
          observacoes?: string | null
          peso_liquido?: string | null
          precaucoes?: string | null
          registro_mapa?: string | null
          status?: string | null
          unidade_peso?: string | null
          updated_at?: string
          user_id?: string
          validade_meses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_quimicos_cadastro: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          empresa_id: string | null
          fabricante: string | null
          fispq_url: string | null
          id: string
          local_armazenamento: string | null
          nome_comercial: string
          observacoes: string | null
          principio_ativo: string | null
          registro_anvisa: string | null
          registro_mapa: string | null
          updated_at: string
          user_id: string
          validade_registro: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          empresa_id?: string | null
          fabricante?: string | null
          fispq_url?: string | null
          id?: string
          local_armazenamento?: string | null
          nome_comercial: string
          observacoes?: string | null
          principio_ativo?: string | null
          registro_anvisa?: string | null
          registro_mapa?: string | null
          updated_at?: string
          user_id: string
          validade_registro?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          empresa_id?: string | null
          fabricante?: string | null
          fispq_url?: string | null
          id?: string
          local_armazenamento?: string | null
          nome_comercial?: string
          observacoes?: string | null
          principio_ativo?: string | null
          registro_anvisa?: string | null
          registro_mapa?: string | null
          updated_at?: string
          user_id?: string
          validade_registro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_quimicos_cadastro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          id: string
          nome: string
          telefone: string | null
          tipo_usuario: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo_usuario?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo_usuario?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rastreabilidade: {
        Row: {
          cliente_destino: string | null
          contem_origem_animal: boolean | null
          created_at: string
          data_venda: string | null
          empresa_id: string | null
          especie_destino: string | null
          fornecedor: string | null
          id: string
          local_entrega: string | null
          lote_mp: string | null
          lote_produto: string | null
          materia_prima: string
          nota_fiscal: string | null
          produto: string
          quantidade_vendida: string | null
          recall_ativo: boolean | null
          recall_data: string | null
          recall_motivo: string | null
          recall_status: string | null
          sif_dipoa: string | null
          tipo_origem_animal: string | null
          user_id: string
        }
        Insert: {
          cliente_destino?: string | null
          contem_origem_animal?: boolean | null
          created_at?: string
          data_venda?: string | null
          empresa_id?: string | null
          especie_destino?: string | null
          fornecedor?: string | null
          id?: string
          local_entrega?: string | null
          lote_mp?: string | null
          lote_produto?: string | null
          materia_prima: string
          nota_fiscal?: string | null
          produto: string
          quantidade_vendida?: string | null
          recall_ativo?: boolean | null
          recall_data?: string | null
          recall_motivo?: string | null
          recall_status?: string | null
          sif_dipoa?: string | null
          tipo_origem_animal?: string | null
          user_id: string
        }
        Update: {
          cliente_destino?: string | null
          contem_origem_animal?: boolean | null
          created_at?: string
          data_venda?: string | null
          empresa_id?: string | null
          especie_destino?: string | null
          fornecedor?: string | null
          id?: string
          local_entrega?: string | null
          lote_mp?: string | null
          lote_produto?: string | null
          materia_prima?: string
          nota_fiscal?: string | null
          produto?: string
          quantidade_vendida?: string | null
          recall_ativo?: boolean | null
          recall_data?: string | null
          recall_motivo?: string | null
          recall_status?: string | null
          sif_dipoa?: string | null
          tipo_origem_animal?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rastreabilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento_mp: {
        Row: {
          aprovado: boolean | null
          armazenamento_inadequado: boolean | null
          certificado_analise_numero: string | null
          certificado_analise_url: string | null
          certificado_analise_valido: boolean | null
          contraprova_local: string | null
          contraprova_quantidade: string | null
          contraprova_retida: boolean | null
          contraprova_validade: string | null
          created_at: string
          data: string
          data_verificacao: string | null
          empresa_id: string | null
          fornecedor: string
          id: string
          insetos: string | null
          integridade_carga: boolean | null
          integridade_observacoes: string | null
          laudo_url: string | null
          lote: string | null
          materia_prima: string
          nota_fiscal_url: string | null
          numero_nota_fiscal: string | null
          observacao_armazenamento: string | null
          observacoes: string | null
          odor: string | null
          quantidade: string | null
          registro_mapa_isento: boolean | null
          registro_mapa_produto: string | null
          saldo: number | null
          status: string | null
          status_verificacao: string | null
          temperatura: string | null
          temperatura_veiculo: string | null
          umidade: string | null
          unidade: string | null
          user_id: string
          validade: string | null
          verificado_por: string | null
        }
        Insert: {
          aprovado?: boolean | null
          armazenamento_inadequado?: boolean | null
          certificado_analise_numero?: string | null
          certificado_analise_url?: string | null
          certificado_analise_valido?: boolean | null
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          fornecedor: string
          id?: string
          insetos?: string | null
          integridade_carga?: boolean | null
          integridade_observacoes?: string | null
          laudo_url?: string | null
          lote?: string | null
          materia_prima: string
          nota_fiscal_url?: string | null
          numero_nota_fiscal?: string | null
          observacao_armazenamento?: string | null
          observacoes?: string | null
          odor?: string | null
          quantidade?: string | null
          registro_mapa_isento?: boolean | null
          registro_mapa_produto?: string | null
          saldo?: number | null
          status?: string | null
          status_verificacao?: string | null
          temperatura?: string | null
          temperatura_veiculo?: string | null
          umidade?: string | null
          unidade?: string | null
          user_id: string
          validade?: string | null
          verificado_por?: string | null
        }
        Update: {
          aprovado?: boolean | null
          armazenamento_inadequado?: boolean | null
          certificado_analise_numero?: string | null
          certificado_analise_url?: string | null
          certificado_analise_valido?: boolean | null
          contraprova_local?: string | null
          contraprova_quantidade?: string | null
          contraprova_retida?: boolean | null
          contraprova_validade?: string | null
          created_at?: string
          data?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          fornecedor?: string
          id?: string
          insetos?: string | null
          integridade_carga?: boolean | null
          integridade_observacoes?: string | null
          laudo_url?: string | null
          lote?: string | null
          materia_prima?: string
          nota_fiscal_url?: string | null
          numero_nota_fiscal?: string | null
          observacao_armazenamento?: string | null
          observacoes?: string | null
          odor?: string | null
          quantidade?: string | null
          registro_mapa_isento?: boolean | null
          registro_mapa_produto?: string | null
          saldo?: number | null
          status?: string | null
          status_verificacao?: string | null
          temperatura?: string | null
          temperatura_veiculo?: string | null
          umidade?: string | null
          unidade?: string | null
          user_id?: string
          validade?: string | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_mp_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      receituarios_medicamentos: {
        Row: {
          arquivo_url: string | null
          created_at: string
          crmv: string
          data_emissao: string
          dosagem: string | null
          empresa_id: string | null
          especie_destino: string | null
          id: string
          lote_op: string | null
          medico_veterinario: string
          numero_receita: string | null
          observacoes: string | null
          principio_ativo: string | null
          produto: string
          uf_crmv: string | null
          updated_at: string
          user_id: string
          validade_receita: string | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          crmv: string
          data_emissao?: string
          dosagem?: string | null
          empresa_id?: string | null
          especie_destino?: string | null
          id?: string
          lote_op?: string | null
          medico_veterinario: string
          numero_receita?: string | null
          observacoes?: string | null
          principio_ativo?: string | null
          produto: string
          uf_crmv?: string | null
          updated_at?: string
          user_id: string
          validade_receita?: string | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          crmv?: string
          data_emissao?: string
          dosagem?: string | null
          empresa_id?: string | null
          especie_destino?: string | null
          id?: string
          lote_op?: string | null
          medico_veterinario?: string
          numero_receita?: string | null
          observacoes?: string | null
          principio_ativo?: string | null
          produto?: string
          uf_crmv?: string | null
          updated_at?: string
          user_id?: string
          validade_receita?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receituarios_medicamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamacoes_qualidade: {
        Row: {
          acao_corretiva: string | null
          acao_imediata: string | null
          acao_preventiva: string | null
          analise_tecnica: string | null
          causa_raiz: string | null
          cliente: string
          cliente_notificado: boolean | null
          conclusao: string | null
          contato_cliente: string | null
          created_at: string
          data_analise: string | null
          data_compra: string | null
          data_fim_recolhimento: string | null
          data_inicio_recolhimento: string | null
          data_reclamacao: string
          data_resposta_cliente: string | null
          descricao_problema: string
          destino_produto_recolhido: string | null
          empresa_id: string | null
          evidencias: string | null
          id: string
          lote: string | null
          lotes_afetados: string | null
          motivo_recolhimento: string | null
          nota_fiscal: string | null
          numero_reclamacao: string
          observacoes: string | null
          pop_referencia: string | null
          prazo_resolucao: string | null
          produto: string
          quantidade_reclamada: string | null
          quantidade_recolhida: string | null
          requer_recolhimento: boolean | null
          responsavel_analise: string | null
          responsavel_resolucao: string | null
          satisfacao_cliente: string | null
          status: string
          status_recolhimento: string | null
          tipo_reclamacao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acao_corretiva?: string | null
          acao_imediata?: string | null
          acao_preventiva?: string | null
          analise_tecnica?: string | null
          causa_raiz?: string | null
          cliente: string
          cliente_notificado?: boolean | null
          conclusao?: string | null
          contato_cliente?: string | null
          created_at?: string
          data_analise?: string | null
          data_compra?: string | null
          data_fim_recolhimento?: string | null
          data_inicio_recolhimento?: string | null
          data_reclamacao?: string
          data_resposta_cliente?: string | null
          descricao_problema: string
          destino_produto_recolhido?: string | null
          empresa_id?: string | null
          evidencias?: string | null
          id?: string
          lote?: string | null
          lotes_afetados?: string | null
          motivo_recolhimento?: string | null
          nota_fiscal?: string | null
          numero_reclamacao: string
          observacoes?: string | null
          pop_referencia?: string | null
          prazo_resolucao?: string | null
          produto: string
          quantidade_reclamada?: string | null
          quantidade_recolhida?: string | null
          requer_recolhimento?: boolean | null
          responsavel_analise?: string | null
          responsavel_resolucao?: string | null
          satisfacao_cliente?: string | null
          status?: string
          status_recolhimento?: string | null
          tipo_reclamacao?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acao_corretiva?: string | null
          acao_imediata?: string | null
          acao_preventiva?: string | null
          analise_tecnica?: string | null
          causa_raiz?: string | null
          cliente?: string
          cliente_notificado?: boolean | null
          conclusao?: string | null
          contato_cliente?: string | null
          created_at?: string
          data_analise?: string | null
          data_compra?: string | null
          data_fim_recolhimento?: string | null
          data_inicio_recolhimento?: string | null
          data_reclamacao?: string
          data_resposta_cliente?: string | null
          descricao_problema?: string
          destino_produto_recolhido?: string | null
          empresa_id?: string | null
          evidencias?: string | null
          id?: string
          lote?: string | null
          lotes_afetados?: string | null
          motivo_recolhimento?: string | null
          nota_fiscal?: string | null
          numero_reclamacao?: string
          observacoes?: string | null
          pop_referencia?: string | null
          prazo_resolucao?: string | null
          produto?: string
          quantidade_reclamada?: string | null
          quantidade_recolhida?: string | null
          requer_recolhimento?: boolean | null
          responsavel_analise?: string | null
          responsavel_resolucao?: string | null
          satisfacao_cliente?: string | null
          status?: string
          status_recolhimento?: string | null
          tipo_reclamacao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclamacoes_qualidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_customizados: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          dados: Json
          data_execucao: string
          empresa_id: string
          hash_integridade: string | null
          id: string
          modelo_id: string
          pdf_path: string | null
          pop_codigo: string | null
          responsavel: string | null
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          dados?: Json
          data_execucao?: string
          empresa_id: string
          hash_integridade?: string | null
          id?: string
          modelo_id: string
          pdf_path?: string | null
          pop_codigo?: string | null
          responsavel?: string | null
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          dados?: Json
          data_execucao?: string
          empresa_id?: string
          hash_integridade?: string | null
          id?: string
          modelo_id?: string
          pdf_path?: string | null
          pop_codigo?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_customizados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_customizados_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos_empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_limpeza: {
        Row: {
          conforme: boolean | null
          created_at: string
          cronograma_id: string | null
          data_execucao: string
          data_verificacao: string | null
          empresa_id: string | null
          executor: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          observacoes: string | null
          status_verificacao: string | null
          tipo_limpeza: string | null
          user_id: string
          verificado_por: string | null
        }
        Insert: {
          conforme?: boolean | null
          created_at?: string
          cronograma_id?: string | null
          data_execucao?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          executor: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          observacoes?: string | null
          status_verificacao?: string | null
          tipo_limpeza?: string | null
          user_id: string
          verificado_por?: string | null
        }
        Update: {
          conforme?: boolean | null
          created_at?: string
          cronograma_id?: string | null
          data_execucao?: string
          data_verificacao?: string | null
          empresa_id?: string | null
          executor?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          observacoes?: string | null
          status_verificacao?: string | null
          tipo_limpeza?: string | null
          user_id?: string
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_limpeza_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas_higiene"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_limpeza_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string
          data_geracao: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          modulo: string
          status: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_geracao?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          modulo: string
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          data_geracao?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          modulo?: string
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      rotulos: {
        Row: {
          altura_mm: number | null
          armazenamento: string | null
          classificacao_label: string | null
          cnpj: string | null
          composicao_ingredientes: string | null
          created_at: string
          empresa_id: string | null
          endereco: string | null
          especie_categoria: string | null
          eventuais_substitutivos: string | null
          fabricacao_placeholder: string | null
          id: string
          indicacoes_uso: string | null
          largura_mm: number | null
          lote_placeholder: string | null
          modo_usar: string | null
          niveis_garantia_texto: string | null
          nome_comercial: string | null
          peso_liquido: string | null
          prazo_validade: string | null
          precaucoes_restricoes: string | null
          produto_id: string
          razao_social: string | null
          registro_mapa: string | null
          rt_crmv: string | null
          rt_nome: string | null
          sac_contato: string | null
          status: string | null
          tipo_rotulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          altura_mm?: number | null
          armazenamento?: string | null
          classificacao_label?: string | null
          cnpj?: string | null
          composicao_ingredientes?: string | null
          created_at?: string
          empresa_id?: string | null
          endereco?: string | null
          especie_categoria?: string | null
          eventuais_substitutivos?: string | null
          fabricacao_placeholder?: string | null
          id?: string
          indicacoes_uso?: string | null
          largura_mm?: number | null
          lote_placeholder?: string | null
          modo_usar?: string | null
          niveis_garantia_texto?: string | null
          nome_comercial?: string | null
          peso_liquido?: string | null
          prazo_validade?: string | null
          precaucoes_restricoes?: string | null
          produto_id: string
          razao_social?: string | null
          registro_mapa?: string | null
          rt_crmv?: string | null
          rt_nome?: string | null
          sac_contato?: string | null
          status?: string | null
          tipo_rotulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          altura_mm?: number | null
          armazenamento?: string | null
          classificacao_label?: string | null
          cnpj?: string | null
          composicao_ingredientes?: string | null
          created_at?: string
          empresa_id?: string | null
          endereco?: string | null
          especie_categoria?: string | null
          eventuais_substitutivos?: string | null
          fabricacao_placeholder?: string | null
          id?: string
          indicacoes_uso?: string | null
          largura_mm?: number | null
          lote_placeholder?: string | null
          modo_usar?: string | null
          niveis_garantia_texto?: string | null
          nome_comercial?: string | null
          peso_liquido?: string | null
          prazo_validade?: string | null
          precaucoes_restricoes?: string | null
          produto_id?: string
          razao_social?: string | null
          registro_mapa?: string | null
          rt_crmv?: string | null
          rt_nome?: string | null
          sac_contato?: string | null
          status?: string | null
          tipo_rotulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotulos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotulos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      saude_manipuladores: {
        Row: {
          apto: boolean | null
          created_at: string
          crm: string | null
          data_exame: string
          data_validade: string | null
          empresa_id: string | null
          funcionario: string
          id: string
          medico: string | null
          observacoes: string | null
          restricoes: string | null
          status: string | null
          tipo_exame: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apto?: boolean | null
          created_at?: string
          crm?: string | null
          data_exame?: string
          data_validade?: string | null
          empresa_id?: string | null
          funcionario: string
          id?: string
          medico?: string | null
          observacoes?: string | null
          restricoes?: string | null
          status?: string | null
          tipo_exame?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apto?: boolean | null
          created_at?: string
          crm?: string | null
          data_exame?: string
          data_validade?: string | null
          empresa_id?: string | null
          funcionario?: string
          id?: string
          medico?: string | null
          observacoes?: string | null
          restricoes?: string | null
          status?: string | null
          tipo_exame?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saude_manipuladores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tempos_mistura_validados: {
        Row: {
          ativo: boolean
          created_at: string
          cv_homogeneidade: number | null
          data_validacao: string
          empresa_id: string | null
          formula_id: string | null
          id: string
          laudo_url: string | null
          metodo: string | null
          nome_formula: string
          observacoes: string | null
          proxima_validacao: string | null
          responsavel: string | null
          tempo_mistura_seg: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          cv_homogeneidade?: number | null
          data_validacao?: string
          empresa_id?: string | null
          formula_id?: string | null
          id?: string
          laudo_url?: string | null
          metodo?: string | null
          nome_formula: string
          observacoes?: string | null
          proxima_validacao?: string | null
          responsavel?: string | null
          tempo_mistura_seg: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          cv_homogeneidade?: number | null
          data_validacao?: string
          empresa_id?: string | null
          formula_id?: string | null
          id?: string
          laudo_url?: string | null
          metodo?: string | null
          nome_formula?: string
          observacoes?: string | null
          proxima_validacao?: string | null
          responsavel?: string | null
          tempo_mistura_seg?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tempos_mistura_validados_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      testes_rastreabilidade: {
        Row: {
          created_at: string
          data_teste: string | null
          destinos_rastreados: number | null
          detalhes_json: Json | null
          direcao: string
          empresa_id: string | null
          id: string
          jusante_encontrado: boolean | null
          lote_testado: string
          materias_primas_rastreadas: number | null
          montante_encontrado: boolean | null
          observacoes: string | null
          produto: string
          resultado: string | null
          tempo_segundos: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_teste?: string | null
          destinos_rastreados?: number | null
          detalhes_json?: Json | null
          direcao?: string
          empresa_id?: string | null
          id?: string
          jusante_encontrado?: boolean | null
          lote_testado: string
          materias_primas_rastreadas?: number | null
          montante_encontrado?: boolean | null
          observacoes?: string | null
          produto: string
          resultado?: string | null
          tempo_segundos?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_teste?: string | null
          destinos_rastreados?: number | null
          detalhes_json?: Json | null
          direcao?: string
          empresa_id?: string | null
          id?: string
          jusante_encontrado?: boolean | null
          lote_testado?: string
          materias_primas_rastreadas?: number | null
          montante_encontrado?: boolean | null
          observacoes?: string | null
          produto?: string
          resultado?: string | null
          tempo_segundos?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testes_rastreabilidade_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tf_autocontroles_sessoes: {
        Row: {
          created_at: string
          cumprimento_plano_anterior: Json | null
          data: string
          empresa_id: string | null
          id: string
          observacoes: string | null
          plano_acao_anterior_url: string | null
          responsavel: string | null
          respostas: Json
          score_pct: number | null
          status: string
          total_nc: number | null
          total_nc_obrigatorios: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cumprimento_plano_anterior?: Json | null
          data?: string
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          plano_acao_anterior_url?: string | null
          responsavel?: string | null
          respostas?: Json
          score_pct?: number | null
          status?: string
          total_nc?: number | null
          total_nc_obrigatorios?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cumprimento_plano_anterior?: Json | null
          data?: string
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          plano_acao_anterior_url?: string | null
          responsavel?: string | null
          respostas?: Json
          score_pct?: number | null
          status?: string
          total_nc?: number | null
          total_nc_obrigatorios?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tf_autocontroles_sessoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          created_at: string
          data: string
          empresa_id: string | null
          funcionario: string
          id: string
          instrutor: string | null
          treinamento: string
          user_id: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          empresa_id?: string | null
          funcionario: string
          id?: string
          instrutor?: string | null
          treinamento: string
          user_id: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          empresa_id?: string | null
          funcionario?: string
          id?: string
          instrutor?: string | null
          treinamento?: string
          user_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validacao_limpeza_linha: {
        Row: {
          contem_medicamento: boolean | null
          created_at: string
          data_validacao: string | null
          empresa_id: string | null
          formula_id: string | null
          hora_validacao: string | null
          id: string
          limite_aceitavel: string | null
          linha_producao: string
          metodo_analise: string | null
          observacoes: string | null
          ordem_producao_id: string | null
          produto_anterior: string
          produto_seguinte: string
          residuo_detectado: string | null
          responsavel: string | null
          resultado: string | null
          tipo_validacao: string | null
          user_id: string
        }
        Insert: {
          contem_medicamento?: boolean | null
          created_at?: string
          data_validacao?: string | null
          empresa_id?: string | null
          formula_id?: string | null
          hora_validacao?: string | null
          id?: string
          limite_aceitavel?: string | null
          linha_producao: string
          metodo_analise?: string | null
          observacoes?: string | null
          ordem_producao_id?: string | null
          produto_anterior: string
          produto_seguinte: string
          residuo_detectado?: string | null
          responsavel?: string | null
          resultado?: string | null
          tipo_validacao?: string | null
          user_id: string
        }
        Update: {
          contem_medicamento?: boolean | null
          created_at?: string
          data_validacao?: string | null
          empresa_id?: string | null
          formula_id?: string | null
          hora_validacao?: string | null
          id?: string
          limite_aceitavel?: string | null
          linha_producao?: string
          metodo_analise?: string | null
          observacoes?: string | null
          ordem_producao_id?: string | null
          produto_anterior?: string
          produto_seguinte?: string
          residuo_detectado?: string | null
          responsavel?: string | null
          resultado?: string | null
          tipo_validacao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validacao_limpeza_linha_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_config: {
        Row: {
          alert_email: string | null
          api_key: string
          api_url: string
          created_at: string | null
          empresa_id: string | null
          id: string
          instance_name: string | null
          is_connected: boolean | null
          last_alert_at: string | null
          last_known_status: string | null
          last_status_change: string | null
          last_status_check: string | null
          updated_at: string | null
        }
        Insert: {
          alert_email?: string | null
          api_key: string
          api_url: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          last_alert_at?: string | null
          last_known_status?: string | null
          last_status_change?: string | null
          last_status_check?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_email?: string | null
          api_key?: string
          api_url?: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          instance_name?: string | null
          is_connected?: boolean | null
          last_alert_at?: string | null
          last_known_status?: string | null
          last_status_change?: string | null
          last_status_check?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_config_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_mensagens: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          empresa_id: string | null
          from_number: string | null
          id: string
          message_sid: string | null
          raw: Json | null
          status: string | null
          to_number: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction?: string
          empresa_id?: string | null
          from_number?: string | null
          id?: string
          message_sid?: string | null
          raw?: Json | null
          status?: string | null
          to_number?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          empresa_id?: string | null
          from_number?: string | null
          id?: string
          message_sid?: string | null
          raw?: Json | null
          status?: string | null
          to_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_mensagens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprovar_documento_pop: {
        Args: {
          _aprovador_nome: string
          _documento_id: string
          _ip?: string
          _motivo?: string
          _novo_status: string
          _pin_hash: string
          _user_agent?: string
        }
        Returns: Json
      }
      can_access_crm: { Args: { _user_id: string }; Returns: boolean }
      criar_auditor_token: {
        Args: {
          _duracao_horas: number
          _empresa_id: string
          _nome_auditor: string
          _observacoes?: string
          _orgao_fiscalizador: string
        }
        Returns: Json
      }
      criar_convite_empresa: {
        Args: {
          _duracao_dias?: number
          _email: string
          _empresa_id: string
          _nome: string
          _papel: Database["public"]["Enums"]["papel_empresa"]
        }
        Returns: Json
      }
      criar_nova_versao_pop: {
        Args: {
          _documento_pai_id: string
          _motivo?: string
          _nova_versao: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      desvincular_empresa_licenca_consultor: {
        Args: { _vinculo_id: string }
        Returns: Json
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_licenca_consultor_ativa:
        | {
            Args: { _produto: string }
            Returns: {
              chave_licenca: string
              created_at: string
              data_expiracao: string
              data_inicio: string
              empresa_id: string | null
              id: string
              liberado_admin: boolean
              nivel: string
              plano: string
              produto: string
              slots_max: number
              slots_usados: number
              status: string
              stripe_checkout_id: string | null
              stripe_customer_id: string | null
              stripe_subscription_id: string | null
              updated_at: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "licencas"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { _produto: string; _user_id: string }
            Returns: {
              chave_licenca: string
              created_at: string
              data_expiracao: string
              data_inicio: string
              empresa_id: string | null
              id: string
              liberado_admin: boolean
              nivel: string
              plano: string
              produto: string
              slots_max: number
              slots_usados: number
              status: string
              stripe_checkout_id: string | null
              stripe_customer_id: string | null
              stripe_subscription_id: string | null
              updated_at: string
              user_id: string | null
            }
            SetofOptions: {
              from: "*"
              to: "licencas"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      get_limite_membros_empresa: {
        Args: { _empresa_id: string }
        Returns: number
      }
      get_papel_empresa: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["papel_empresa"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_membro_empresa: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      pode_usar_empresa: {
        Args: { _empresa_id: string; _user_id: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      tem_papel_empresa: {
        Args: {
          _empresa_id: string
          _papel: Database["public"]["Enums"]["papel_empresa"]
          _user_id: string
        }
        Returns: boolean
      }
      validar_auditor_token: {
        Args: { _token: string }
        Returns: {
          ativo: boolean
          empresa_id: string
          expira_em: string
          id: string
        }[]
      }
      validar_codigo_referral: {
        Args: { _codigo: string }
        Returns: {
          indicacao_id: string
          indicador_user_id: string
          valido: boolean
        }[]
      }
      vincular_empresa_licenca_consultor: {
        Args: { _empresa_id: string; _licenca_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "comercial"
      papel_empresa: "admin" | "rt" | "operador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "comercial"],
      papel_empresa: ["admin", "rt", "operador"],
    },
  },
} as const
