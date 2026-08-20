// ============================================================================
// Seletor de Instrução de Trabalho + Periodicidade
//
// Usado nos formulários de anexo de documento BPF. Ambos os campos são
// OPCIONAIS por padrão: tornar obrigatório trava o upload de quem ainda não
// decorou os códigos de IT, e o sistema entra em produção com fábricas que
// estão vendo esses códigos pela primeira vez.
// ============================================================================

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INSTRUCOES_TRABALHO } from "@/config/instrucoesTrabalho";
import {
  FREQUENCIAS,
  FREQUENCIA_LABEL,
  inferirFrequencia,
  type Frequencia,
} from "@/lib/bpfStorage";

/**
 * O Select do Radix rejeita `<SelectItem value="">` — usar string vazia como
 * valor de item quebra o componente em runtime. Daí o sentinela: ele
 * representa "nenhum" na UI e é convertido para "" na borda do componente,
 * de modo que quem consome nunca vê o sentinela.
 */
const NENHUM = "__nenhum__";

/** Altura confortável para toque: operador de fábrica, muitas vezes de luva. */
const ALTURA_TOQUE = "h-12";

export interface SeletorItFrequenciaProps {
  /** POP já selecionado no formulário. Filtra a lista de ITs. */
  popCodigo?: string | null;
  itCodigo: string;
  onItChange: (valor: string) => void;
  frequencia: string;
  onFrequenciaChange: (valor: string) => void;
  obrigatorio?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SeletorItFrequencia({
  popCodigo,
  itCodigo,
  onItChange,
  frequencia,
  onFrequenciaChange,
  obrigatorio = false,
  disabled = false,
  className,
}: SeletorItFrequenciaProps) {
  const its = useMemo(() => {
    if (!popCodigo) return INSTRUCOES_TRABALHO;
    return INSTRUCOES_TRABALHO.filter((it) => it.popCodigo === popCodigo);
  }, [popCodigo]);

  const handleIt = (valor: string) => {
    const codigo = valor === NENHUM ? "" : valor;
    onItChange(codigo);

    // Preenche a periodicidade sugerida pela IT APENAS se o campo estiver
    // vazio. Escolha do usuário nunca é sobrescrita por sugestão automática.
    if (codigo && !frequencia) {
      const it = INSTRUCOES_TRABALHO.find((i) => i.id === codigo);
      if (it?.frequencia) {
        onFrequenciaChange(inferirFrequencia(it.frequencia));
      }
    }
  };

  const handleFrequencia = (valor: string) => {
    onFrequenciaChange(valor === NENHUM ? "" : valor);
  };

  return (
    <div className={className ?? "grid gap-4 sm:grid-cols-2"}>
      <div className="space-y-2">
        <Label htmlFor="seletor-it">
          Instrução de Trabalho
          {obrigatorio && <span className="text-destructive ml-1">*</span>}
          {!obrigatorio && (
            <span className="text-muted-foreground font-normal ml-1 text-xs">(opcional)</span>
          )}
        </Label>
        <Select value={itCodigo || NENHUM} onValueChange={handleIt} disabled={disabled}>
          <SelectTrigger id="seletor-it" className={ALTURA_TOQUE}>
            <SelectValue placeholder="Selecione a IT" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NENHUM} className={ALTURA_TOQUE}>
              <span className="text-muted-foreground">Sem IT definida</span>
            </SelectItem>
            {its.map((it) => (
              <SelectItem key={it.id} value={it.id} className={ALTURA_TOQUE}>
                <span className="font-mono text-xs mr-2">{it.id}</span>
                {it.titulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {popCodigo && its.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma IT cadastrada para {popCodigo}.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="seletor-frequencia">
          Periodicidade
          {obrigatorio && <span className="text-destructive ml-1">*</span>}
          {!obrigatorio && (
            <span className="text-muted-foreground font-normal ml-1 text-xs">(opcional)</span>
          )}
        </Label>
        <Select
          value={frequencia || NENHUM}
          onValueChange={handleFrequencia}
          disabled={disabled}
        >
          <SelectTrigger id="seletor-frequencia" className={ALTURA_TOQUE}>
            <SelectValue placeholder="Selecione a periodicidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NENHUM} className={ALTURA_TOQUE}>
              <span className="text-muted-foreground">Sem periodicidade</span>
            </SelectItem>
            {FREQUENCIAS.map((f) => (
              <SelectItem key={f} value={f} className={ALTURA_TOQUE}>
                {FREQUENCIA_LABEL[f as Frequencia]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default SeletorItFrequencia;
