import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator } from "lucide-react";
import { formatCurrency, parseCurrencyToDecimal, parsePercentageToDecimal, formatPercentage } from "@/lib/utils";
import { NumericInput } from "@/components/ui/numeric-input";

const CalculadoraPreco = () => {
  const navigate = useNavigate();
  const [precoCusto, setPrecoCusto] = useState("");
  const [custoIndireto, setCustoIndireto] = useState("");
  const [margem, setMargem] = useState("");
  const [taxa, setTaxa] = useState("");

  const calcularPrecoVenda = () => {
    const custoBase = parseCurrencyToDecimal(precoCusto);
    const percentualCustoIndireto = parsePercentageToDecimal(custoIndireto || "0");
    const percentualMargem = parsePercentageToDecimal(margem || "0");
    const percentualTaxa = parsePercentageToDecimal(taxa || "0");

    // Custo Indireto é calculado sobre o preço de custo
    const valorCustoIndireto = custoBase * (percentualCustoIndireto / 100);
    
    // Custo Total = Preço de Custo + Custo Indireto
    const custoTotal = custoBase + valorCustoIndireto;

    // Margem é aplicada sobre o custo total
    const valorMargem = custoTotal * (percentualMargem / 100);
    
    // A taxa da plataforma deve ser compensada no preço sugerido
    // Preço Sugerido = (Custo Total + Margem) ÷ (1 - Taxa da Plataforma)
    const custoTotalComMargem = custoTotal + valorMargem;
    const precoFinal = percentualTaxa > 0 
      ? custoTotalComMargem / (1 - percentualTaxa / 100)
      : custoTotalComMargem;

    // Valor da taxa (deduzido do preço sugerido)
    const valorTaxa = precoFinal - custoTotalComMargem;
    
    // Valor recebido após a taxa = Preço Sugerido - Taxa
    const valorRecebido = precoFinal - valorTaxa;

    // Lucro = Valor recebido - Custo Total
    const lucro = valorRecebido - custoTotal;

    // Rentabilidade = Lucro ÷ Custo Total × 100
    const rentabilidade = custoTotal > 0 ? (lucro / precoFinal) * 100 : 0;

    return {
      custoBase,
      custoTotal,
      valorCustoIndireto,
      valorMargem,
      valorTaxa,
      precoFinal,
      lucro,
      rentabilidade
    };
  };

  const resultado = calcularPrecoVenda();
  const temDados = precoCusto && parseFloat(precoCusto.replace(/\D/g, '')) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Calculator className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Calculadora de Preço</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-6 safe-area-bottom max-w-2xl mx-auto">
        <div className="space-y-4">
          {/* Input Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Dados do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preço de Custo */}
              <div className="space-y-2">
                <Label htmlFor="precoCusto" className="text-sm font-medium">
                  Preço de Custo (R$)
                </Label>
                <NumericInput
                  id="precoCusto"
                  decimalPlaces={2}
                  placeholder="0,00"
                  value={precoCusto}
                  onValueChange={setPrecoCusto}
                  className="text-base h-12"
                />
              </div>

              {/* Custo Indireto */}
              <div className="space-y-2">
                <Label htmlFor="custoIndireto" className="text-sm font-medium">
                  Custo Indireto (%)
                </Label>
                <NumericInput
                  id="custoIndireto"
                  decimalPlaces={2}
                  placeholder="0,00"
                  value={custoIndireto}
                  onValueChange={setCustoIndireto}
                  className="text-base h-12"
                />
              </div>

              {/* Margem de Lucro */}
              <div className="space-y-2">
                <Label htmlFor="margem" className="text-sm font-medium">
                  Margem de Lucro (%)
                </Label>
                <NumericInput
                  id="margem"
                  decimalPlaces={2}
                  placeholder="0,00"
                  value={margem}
                  onValueChange={setMargem}
                  className="text-base h-12"
                />
              </div>

              {/* Taxa */}
              <div className="space-y-2">
                <Label htmlFor="taxa" className="text-sm font-medium">
                  Taxa da Plataforma (%)
                </Label>
                <NumericInput
                  id="taxa"
                  decimalPlaces={2}
                  placeholder="0,00"
                  value={taxa}
                  onValueChange={setTaxa}
                  className="text-base h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Result Card */}
          {temDados && (
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="text-base">Resultado do Cálculo</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  {/* Preço de Custo */}
                  <div className="flex justify-between pb-2">
                    <span className="text-muted-foreground">Preço de Custo:</span>
                    <span className="font-medium">{formatCurrency(resultado.custoBase)}</span>
                  </div>

                  {/* Custo Indireto */}
                  {custoIndireto && parsePercentageToDecimal(custoIndireto) > 0 && (
                    <div className="flex justify-between pb-2">
                      <span className="text-muted-foreground">
                        + Custo Indireto ({formatPercentage(parsePercentageToDecimal(custoIndireto))}%):
                      </span>
                      <span className="font-medium">{formatCurrency(resultado.valorCustoIndireto)}</span>
                    </div>
                  )}

                  {/* Custo Total */}
                  <div className="flex justify-between border-t border-primary/20 pt-2">
                    <span className="font-semibold">Custo Total:</span>
                    <span className="font-semibold">{formatCurrency(resultado.custoTotal)}</span>
                  </div>

                  {/* Margem */}
                  {margem && parsePercentageToDecimal(margem) > 0 && (
                    <div className="flex justify-between pb-2">
                      <span className="text-muted-foreground">
                        + Margem ({formatPercentage(parsePercentageToDecimal(margem))}%):
                      </span>
                      <span className="font-medium text-green-600">{formatCurrency(resultado.valorMargem)}</span>
                    </div>
                  )}

                  {/* Taxa */}
                  {taxa && parsePercentageToDecimal(taxa) > 0 && (
                    <div className="flex justify-between pb-2">
                      <span className="text-muted-foreground">
                        + Taxa ({formatPercentage(parsePercentageToDecimal(taxa))}%):
                      </span>
                      <span className="font-medium text-orange-600">{formatCurrency(resultado.valorTaxa)}</span>
                    </div>
                  )}

                  {/* Preço Sugerido */}
                  <div className="flex justify-between border-t-2 border-primary pt-3 mt-3">
                    <span className="font-bold text-base">Preço Sugerido:</span>
                    <span className="font-bold text-lg text-primary">{formatCurrency(resultado.precoFinal)}</span>
                  </div>

                  {/* Lucro e Rentabilidade */}
                  <div className="bg-muted/50 rounded-lg p-3 mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lucro:</span>
                      <span className={`font-semibold ${resultado.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(resultado.lucro)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rentabilidade:</span>
                      <span className={`font-semibold ${resultado.rentabilidade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(resultado.rentabilidade)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card when no data */}
          {!temDados && (
            <Card className="shadow-sm border-dashed">
              <CardContent className="p-6 text-center">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Preencha os campos acima para calcular o preço de venda sugerido
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CalculadoraPreco;
