// ============================================================================
// Formulário preenchível de uma Instrução de Trabalho
//
// Renderiza as seções e campos tipados vindos de `modelos_bpf.conteudo.secoes`.
// Uso em chão de fábrica: alvos de toque grandes, um campo por linha no
// celular, e o passo a passo como checkbox para o operador marcar conforme
// executa — não como texto para ler e esquecer.
// ============================================================================

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FREQUENCIA_LABEL, isFrequencia } from "@/lib/bpfStorage";
import type { CampoModelo, ModeloIt, ValoresModelo } from "@/lib/importadorIts";

const ALTURA_TOQUE = "h-12";

export interface FormularioItProps {
  modelo: ModeloIt;
  valores: ValoresModelo;
  onChange: (valores: ValoresModelo) => void;
  /** Chaves com pendência, para destacar o que falta após tentar salvar. */
  pendentes?: string[];
  disabled?: boolean;
}

export function FormularioIt({
  modelo,
  valores,
  onChange,
  pendentes = [],
  disabled = false,
}: FormularioItProps) {
  const setValor = (chave: string, valor: string | number | boolean) => {
    onChange({ ...valores, [chave]: valor });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho técnico da IT — o operador precisa ver o objetivo e os EPIs
          ANTES de começar a marcar passos. */}
      <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="font-mono text-xs">{modelo.codigo}</Badge>
          {modelo.pop && (
            <Badge variant="outline" className="font-mono text-xs">{modelo.pop}</Badge>
          )}
          {modelo.frequencia && (
            <Badge variant="secondary" className="text-xs">
              {isFrequencia(modelo.frequencia)
                ? FREQUENCIA_LABEL[modelo.frequencia]
                : modelo.frequencia}
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium">{modelo.titulo}</p>
        {modelo.objetivo && (
          <p className="text-xs text-muted-foreground">{modelo.objetivo}</p>
        )}
        {modelo.epis.length > 0 && (
          <p className="text-xs">
            <span className="font-semibold text-destructive">EPIs obrigatórios: </span>
            {modelo.epis.join(", ")}
          </p>
        )}
      </div>

      {modelo.secoes.map((secao) => (
        <section key={secao.id} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{secao.titulo}</h3>
            {secao.descricao && (
              <p className="text-xs text-muted-foreground">{secao.descricao}</p>
            )}
          </div>

          <div className="space-y-3">
            {secao.campos.map((campo) => {
              const chave = `${secao.id}.${campo.id}`;
              return (
                <CampoIt
                  key={chave}
                  chave={chave}
                  campo={campo}
                  valor={valores[chave]}
                  pendente={pendentes.includes(chave)}
                  disabled={disabled}
                  onChange={setValor}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

interface CampoItProps {
  chave: string;
  campo: CampoModelo;
  valor: string | number | boolean | undefined;
  pendente: boolean;
  disabled: boolean;
  onChange: (chave: string, valor: string | number | boolean) => void;
}

function CampoIt({ chave, campo, valor, pendente, disabled, onChange }: CampoItProps) {
  const marcaObrigatorio = campo.obrigatorio && (
    <span className="text-destructive ml-1">*</span>
  );
  const classePendente = pendente ? "border-destructive ring-1 ring-destructive" : "";

  // Checkbox ocupa uma linha só, com o rótulo clicável: no celular, alvo
  // pequeno em passo de procedimento gera marcação errada.
  if (campo.tipo === "checkbox") {
    return (
      <div
        className={`flex items-start gap-3 rounded-md border p-3 ${classePendente}`}
      >
        <Checkbox
          id={chave}
          checked={valor === true}
          disabled={disabled}
          onCheckedChange={(c) => onChange(chave, c === true)}
          className="mt-0.5 h-5 w-5"
        />
        <div className="space-y-1">
          <Label htmlFor={chave} className="text-sm font-normal leading-snug cursor-pointer">
            {campo.rotulo}
            {marcaObrigatorio}
          </Label>
          {campo.ajuda && (
            <p className="text-[11px] text-muted-foreground">{campo.ajuda}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={chave} className="text-sm">
        {campo.rotulo}
        {marcaObrigatorio}
        {campo.unidade && (
          <span className="text-muted-foreground font-normal ml-1">({campo.unidade})</span>
        )}
      </Label>

      {campo.tipo === "texto_longo" ? (
        <Textarea
          id={chave}
          value={String(valor ?? "")}
          disabled={disabled}
          rows={3}
          className={classePendente}
          onChange={(e) => onChange(chave, e.target.value)}
        />
      ) : campo.tipo === "selecao" ? (
        <Select
          value={String(valor ?? "")}
          disabled={disabled}
          onValueChange={(v) => onChange(chave, v)}
        >
          <SelectTrigger id={chave} className={`${ALTURA_TOQUE} ${classePendente}`}>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(campo.opcoes ?? []).map((o) => (
              <SelectItem key={o} value={o} className={ALTURA_TOQUE}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : campo.tipo === "assinatura" ? (
        // Assinatura por nome digitado + carimbo SHA-256 já existente no
        // fluxo de execução. Não é assinatura desenhada: o carimbo é que dá
        // valor probatório, o nome aqui é a identificação de quem responde.
        <Input
          id={chave}
          value={String(valor ?? "")}
          disabled={disabled}
          placeholder="Nome completo de quem assina"
          className={`${ALTURA_TOQUE} ${classePendente}`}
          onChange={(e) => onChange(chave, e.target.value)}
        />
      ) : (
        <Input
          id={chave}
          type={
            campo.tipo === "numero"
              ? "number"
              : campo.tipo === "data"
                ? "date"
                : campo.tipo === "hora"
                  ? "time"
                  : "text"
          }
          inputMode={campo.tipo === "numero" ? "decimal" : undefined}
          value={String(valor ?? "")}
          disabled={disabled}
          className={`${ALTURA_TOQUE} ${classePendente}`}
          onChange={(e) => onChange(chave, e.target.value)}
        />
      )}

      {campo.ajuda && <p className="text-[11px] text-muted-foreground">{campo.ajuda}</p>}
    </div>
  );
}

export default FormularioIt;
