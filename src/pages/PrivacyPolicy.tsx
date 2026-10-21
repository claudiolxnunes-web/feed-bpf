import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";

const SELLER = "Cláudio Luiz Xavier Nunes";
const TRADING = "BPF_Consult";
const CONTACT = "contato@bpfconsult.com.br";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-xl font-bold text-[#173404]">Política de Privacidade</h1>
          <div className="w-20" />
        </div>

        <ScrollArea className="h-[70vh] p-8">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-2"><strong>Controlador dos Dados:</strong> {SELLER} (operando sob o nome comercial "{TRADING}").</p>
            <p className="text-slate-600 mb-6 text-sm italic">Última atualização: 27 de maio de 2026</p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">1. Identificação do Controlador</h2>
            <p className="text-slate-600 mb-4">
              {SELLER}, atuando comercialmente como {TRADING} ("nós", "nosso"), é o controlador dos dados pessoais tratados nesta plataforma, conforme a Lei Geral de Proteção de Dados (LGPD). Contato: <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">2. Categorias de Dados Coletados</h2>
            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, CNPJ/CPF, razão social.</li>
              <li><strong>Credenciais de acesso:</strong> e-mail de login e senha criptografada.</li>
              <li><strong>Mensagens de suporte:</strong> conteúdo de tickets, e-mails e chat.</li>
              <li><strong>Dados de uso/telemetria:</strong> logs de acesso, ações no sistema, navegador, sistema operacional.</li>
              <li><strong>Identificadores técnicos:</strong> endereço IP, identificadores de dispositivo, cookies.</li>
              <li><strong>Dados operacionais inseridos:</strong> informações de produção, POPs, auditorias, lotes e fornecedores enviadas voluntariamente pelo usuário em sua empresa.</li>
            </ul>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">3. Finalidades e Base Legal do Tratamento</h2>
            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
              <li><strong>Execução de contrato:</strong> criar conta, prover acesso aos sistemas (Feed_BPF, Audits_BPF, NutriCRM, AgroGestão, AgroRC, Nutri_Agro Labels) e prestar suporte.</li>
              <li><strong>Cumprimento de obrigação legal:</strong> emissão fiscal, prevenção a fraudes, atendimento a autoridades regulatórias (MAPA, Receita Federal).</li>
              <li><strong>Legítimo interesse:</strong> segurança, prevenção a abusos, melhoria de produto, análises estatísticas agregadas.</li>
              <li><strong>Consentimento:</strong> envio de comunicações de marketing (opcional, revogável a qualquer momento).</li>
            </ul>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-slate-600 mb-3">Compartilhamos dados estritamente necessários com as seguintes categorias de destinatários:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
              <li><strong>Paddle.com Market Limited (Merchant of Record):</strong> processa todos os pagamentos, assinaturas, impostos, faturamento e estornos em nosso nome. Os dados de pagamento são coletados e tratados diretamente pelo Paddle conforme sua <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">política de privacidade</a>.</li>
              <li><strong>Provedores de infraestrutura:</strong> hospedagem em nuvem, banco de dados, armazenamento de arquivos e envio de e-mails transacionais.</li>
              <li><strong>Ferramentas de análise e suporte:</strong> monitoramento de erros e atendimento.</li>
              <li><strong>Consultores profissionais:</strong> contábeis, jurídicos e fiscais, sob dever de confidencialidade.</li>
              <li><strong>Autoridades públicas:</strong> quando exigido por lei, ordem judicial ou para defesa de direitos.</li>
            </ul>
            <p className="text-slate-600 mb-4">Não vendemos seus dados pessoais a terceiros.</p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">5. Retenção de Dados</h2>
            <p className="text-slate-600 mb-4">
              Mantemos seus dados pelo tempo necessário ao cumprimento das finalidades acima, observando prazos legais (ex.: 5 anos para dados fiscais). Encerrada a relação contratual, os dados são anonimizados ou eliminados, salvo obrigação legal de guarda.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">6. Direitos do Titular (LGPD)</h2>
            <p className="text-slate-600 mb-3">Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
              <li>Confirmação da existência e acesso aos seus dados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>Portabilidade dos dados a outro fornecedor;</li>
              <li>Eliminação dos dados tratados com base no consentimento;</li>
              <li>Informação sobre compartilhamentos realizados;</li>
              <li>Revogação do consentimento;</li>
              <li>Apresentação de reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</li>
            </ul>
            <p className="text-slate-600 mb-4">Para exercer esses direitos, envie e-mail a <a href={`mailto:${CONTACT}`} className="text-primary underline">{CONTACT}</a>. Respondemos em até 15 dias.</p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">7. Segurança</h2>
            <p className="text-slate-600 mb-4">
              Adotamos medidas técnicas e organizacionais apropriadas: criptografia em trânsito (TLS) e em repouso, controle de acesso por papéis (RLS), autenticação multifator, backups automáticos e registro de auditoria. Limitamos o acesso aos dados a colaboradores que dele necessitam para a prestação dos serviços.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">8. Cookies</h2>
            <p className="text-slate-600 mb-4">
              Utilizamos cookies essenciais (sessão e autenticação), de preferência (tema, idioma) e analíticos agregados (uso da plataforma). Você pode gerenciar cookies nas configurações do navegador. Cookies essenciais são necessários ao funcionamento e não podem ser desabilitados.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">9. Transferências Internacionais</h2>
            <p className="text-slate-600 mb-4">
              Alguns processadores (incluindo Paddle e provedores de nuvem) podem tratar dados fora do Brasil. Garantimos que tais transferências ocorram com base em salvaguardas adequadas previstas na LGPD.
            </p>

            <h2 className="text-lg font-bold text-[#173404] mt-8 mb-4">10. Alterações desta Política</h2>
            <p className="text-slate-600 mb-4">
              Esta política pode ser atualizada. A versão vigente estará sempre disponível nesta página, com a data de revisão.
            </p>
          </div>
        </ScrollArea>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Button onClick={() => navigate(-1)} className="bg-[#173404] text-white rounded-full px-8">Entendido</Button>
        </div>
      </div>
    </div>
  );
}
