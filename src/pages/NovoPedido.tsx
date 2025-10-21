import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  handleCurrencyInput,
  parseCurrencyToDecimal,
  formatCurrency,
} from "@/lib/utils";

interface Produto {
  id: string;
  nome: string;
  codigo?: string;
  precoVenda: number;
  fichaTecnica?: Array<{
    insumoId: string;
    quantidade: number;
  }>;
  quantoRende?: number;
  canaisVenda?: Array<{
    tipo: "balcao" | "plataforma";
    plataformaId?: string;
    plataformaNome?: string;
    valorFinal?: string;
  }>;
}

interface Plataforma {
  id: string;
  nome: string;
}

interface ItemPedido {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

const NovoPedido = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [quantidade, setQuantidade] = useState("");
  const [plataformaSelecionada, setPlataformaSelecionada] = useState("");
  const [temFrete, setTemFrete] = useState(false);
  const [responsavelFrete, setResponsavelFrete] = useState("plataforma");
  const [valorFrete, setValorFrete] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [etapaAtual, setEtapaAtual] = useState<"plataforma" | "produtos">("plataforma");

  useEffect(() => {
    const produtosData = JSON.parse(localStorage.getItem("produtos") || "[]");
    const plataformasData = JSON.parse(localStorage.getItem("plataformas") || "[]");
    setProdutos(produtosData);
    setPlataformas(plataformasData);
    
    // Adicionar opção Balcão se não existir
    const temBalcao = plataformasData.some((p: Plataforma) => p.nome.toLowerCase() === "balcão");
    if (!temBalcao) {
      setPlataformas([{ id: "balcao", nome: "Balcão" }, ...plataformasData]);
    }
  }, []);


  const getPrecoParaPlataforma = (produto: Produto): number => {
    if (!plataformaSelecionada) return produto.precoVenda;
    
    // Buscar o valor final configurado para esta plataforma
    const canalVenda = produto.canaisVenda?.find(canal => {
      if (plataformaSelecionada.toLowerCase() === "balcão") {
        return canal.tipo === "balcao";
      }
      return canal.plataformaNome?.toLowerCase() === plataformaSelecionada.toLowerCase();
    });
    
    // Se encontrou valor configurado, usar ele
    if (canalVenda?.valorFinal) {
      return parseCurrencyToDecimal(canalVenda.valorFinal);
    }
    
    // Senão, usar preço de venda padrão
    return produto.precoVenda;
  };

  const produtosFiltrados = buscaProduto
    ? produtos.filter(
        (p) =>
          p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
          p.codigo?.toLowerCase().includes(buscaProduto.toLowerCase())
      )
    : [];

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    const precoParaPlataforma = getPrecoParaPlataforma(produto);
    setBuscaProduto(`${produto.nome} - ${formatCurrency(precoParaPlataforma)}`);
    setMostrarResultados(false);
  };

  const handleAdicionarItem = () => {
    if (!produtoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      });
      return;
    }

    const qtd = parseFloat(quantidade.replace(",", "."));
    if (!qtd || qtd <= 0) {
      toast({
        title: "Erro",
        description: "Informe uma quantidade válida",
        variant: "destructive",
      });
      return;
    }

    const precoParaPlataforma = getPrecoParaPlataforma(produtoSelecionado);
    
    const novoItem: ItemPedido = {
      produtoId: produtoSelecionado.id,
      nomeProduto: produtoSelecionado.nome,
      quantidade: qtd,
      precoUnitario: precoParaPlataforma,
      subtotal: qtd * precoParaPlataforma,
    };

    setItens([...itens, novoItem]);
    
    // Limpar campos
    setProdutoSelecionado(null);
    setBuscaProduto("");
    setQuantidade("");

    toast({
      title: "Item adicionado",
      description: `${novoItem.nomeProduto} adicionado ao pedido`,
    });
  };

  const handleRemoverItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    const subtotal = itens.reduce((acc, item) => acc + item.subtotal, 0);
    const frete = temFrete && responsavelFrete === "loja" 
      ? parseCurrencyToDecimal(valorFrete) 
      : 0;
    return subtotal + frete;
  };

  const handleIniciarPedido = () => {
    if (!plataformaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma plataforma",
        variant: "destructive",
      });
      return;
    }
    
    setEtapaAtual("produtos");
  };

  const handleFecharPedido = () => {
    if (itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione ao menos um item ao pedido",
        variant: "destructive",
      });
      return;
    }

    if (temFrete && responsavelFrete === "loja" && !valorFrete) {
      toast({
        title: "Erro",
        description: "Informe o valor do frete",
        variant: "destructive",
      });
      return;
    }

    const total = calcularTotal();

    // Criar pedido
    const pedido = {
      id: Date.now().toString(),
      itens,
      plataforma: plataformaSelecionada,
      temFrete,
      responsavelFrete: temFrete ? responsavelFrete : null,
      valorFrete: temFrete && responsavelFrete === "loja" ? parseCurrencyToDecimal(valorFrete) : 0,
      observacoes,
      total,
      data: new Date().toISOString(),
    };

    // Salvar pedido
    const pedidos = JSON.parse(localStorage.getItem("pedidos") || "[]");
    pedidos.push(pedido);
    localStorage.setItem("pedidos", JSON.stringify(pedidos));

    // Atualizar estoque
    const estoqueData = JSON.parse(localStorage.getItem("estoque") || "{}");
    const movimentacoes = JSON.parse(localStorage.getItem("movimentacoes") || "[]");

    itens.forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      if (!produto) return;

      // Dar baixa no estoque do produto
      const produtoEstoqueKey = `produto-${produto.id}`;
      const quantidadeAtual = estoqueData[produtoEstoqueKey] || 0;
      estoqueData[produtoEstoqueKey] = Math.max(0, quantidadeAtual - item.quantidade);

      // Registrar movimentação do produto
      movimentacoes.push({
        id: `${Date.now()}-${produto.id}`,
        itemId: produtoEstoqueKey,
        tipo: "saida",
        quantidade: item.quantidade,
        data: new Date().toISOString(),
        observacao: `Venda - Pedido #${pedido.id}`,
        origem: "pedido",
        pedidoId: pedido.id,
      });

      // Se tem ficha técnica, deduzir insumos
      if (produto.fichaTecnica && produto.fichaTecnica.length > 0) {
        const quantoRende = produto.quantoRende || 1;
        
        produto.fichaTecnica.forEach((insumoVinculado) => {
          const quantidadeNecessaria = (insumoVinculado.quantidade * item.quantidade) / quantoRende;
          const insumoId = `insumo-${insumoVinculado.insumoId}`;
          const quantidadeAtualInsumo = estoqueData[insumoId] || 0;
          estoqueData[insumoId] = Math.max(0, quantidadeAtualInsumo - quantidadeNecessaria);

          // Registrar movimentação do insumo
          movimentacoes.push({
            id: `${Date.now()}-${insumoVinculado.insumoId}`,
            itemId: insumoId,
            tipo: "saida",
            quantidade: quantidadeNecessaria,
            data: new Date().toISOString(),
            observacao: `Dedução automática - Pedido #${pedido.id} (${produto.nome})`,
            origem: "pedido",
            pedidoId: pedido.id,
          });
        });
      }
    });

    localStorage.setItem("estoque", JSON.stringify(estoqueData));
    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));

    // Atualizar vendas do dia
    const hoje = new Date().toDateString();
    const vendasHoje = JSON.parse(localStorage.getItem("vendasHoje") || "{}");
    if (vendasHoje.data !== hoje) {
      vendasHoje.data = hoje;
      vendasHoje.total = 0;
      vendasHoje.quantidade = 0;
    }
    vendasHoje.total += total;
    vendasHoje.quantidade += 1;
    localStorage.setItem("vendasHoje", JSON.stringify(vendasHoje));

    toast({
      title: "Pedido fechado com sucesso!",
      description: `Total: ${formatCurrency(total)}`,
    });

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <ArrowLeft className="h-8 w-8 text-foreground" />
          </Button>

          <h1 className="text-base sm:text-lg font-bold text-primary">
            Novo Pedido
          </h1>

          <div className="w-10 sm:w-11"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 pb-24 safe-area-bottom">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Etapa 1: Seleção de Plataforma */}
          {etapaAtual === "plataforma" && (
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4 text-foreground">Selecione a Plataforma do Pedido</h2>
                <Label htmlFor="plataforma" className="text-base font-semibold">Plataforma</Label>
                <select
                  id="plataforma"
                  value={plataformaSelecionada}
                  onChange={(e) => setPlataformaSelecionada(e.target.value)}
                  className="w-full h-12 px-4 border-2 border-input rounded-md mt-2 bg-background text-base"
                >
                  <option value="">Selecione uma plataforma</option>
                  {plataformas.map((plat) => (
                    <option key={plat.id} value={plat.nome}>
                      {plat.nome}
                    </option>
                  ))}
                </select>
                
                <Button
                  onClick={handleIniciarPedido}
                  className="w-full mt-6 h-12 text-base font-semibold"
                  disabled={!plataformaSelecionada}
                >
                  Continuar para Produtos
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Etapa 2: Adicionar Produtos */}
          {etapaAtual === "produtos" && (
            <>
              {/* Info da Plataforma Selecionada */}
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Plataforma selecionada:</span>
                    <p className="font-bold text-lg text-primary">{plataformaSelecionada}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEtapaAtual("plataforma");
                      setItens([]);
                    }}
                  >
                    Alterar
                  </Button>
                </CardContent>
              </Card>

              {/* Buscar Produto */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="relative">
                    <Label htmlFor="produto" className="text-foreground font-semibold">
                      Buscar Produto
                    </Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="produto"
                        value={buscaProduto}
                        onChange={(e) => {
                          setBuscaProduto(e.target.value);
                          setMostrarResultados(true);
                          setProdutoSelecionado(null);
                        }}
                        onFocus={() => setMostrarResultados(true)}
                        placeholder="Digite o nome ou código do produto"
                        className="pl-10 bg-background border-input"
                      />
                    </div>

                    {/* Resultados da Busca */}
                    {mostrarResultados && buscaProduto && (
                      <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {produtosFiltrados.length > 0 ? (
                          produtosFiltrados.map((produto) => {
                            const precoParaPlataforma = getPrecoParaPlataforma(produto);
                            return (
                              <button
                                key={produto.id}
                                onClick={() => handleSelecionarProduto(produto)}
                                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0"
                              >
                                <div className="font-medium text-foreground">{produto.nome}</div>
                                <div className="text-sm text-muted-foreground flex justify-between items-center mt-1">
                                  {produto.codigo && <span className="text-xs">{produto.codigo}</span>}
                                  <span className="font-semibold text-primary ml-auto">
                                    {formatCurrency(precoParaPlataforma)}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                            Nenhum produto encontrado.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preço de Venda e Quantidade */}
                  {produtoSelecionado && (
                    <div className="p-3 bg-muted/50 rounded-md border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Preço de Venda:</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(getPrecoParaPlataforma(produtoSelecionado))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quantidade */}
                  <div>
                    <Label htmlFor="quantidade" className="text-foreground font-semibold">
                      Quantidade
                    </Label>
                    <Input
                      id="quantidade"
                      type="text"
                      value={quantidade}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,]/g, "");
                        setQuantidade(value);
                      }}
                      placeholder="0,00"
                      className="mt-2 bg-background border-input"
                    />
                  </div>

                  {/* Subtotal Preview */}
                  {produtoSelecionado && quantidade && parseFloat(quantidade.replace(",", ".")) > 0 && (
                    <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Subtotal:</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(
                            parseFloat(quantidade.replace(",", ".")) * getPrecoParaPlataforma(produtoSelecionado)
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleAdicionarItem}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Adicionar Item
                  </Button>
                </CardContent>
              </Card>

          {/* Itens do Pedido */}
          {itens.length > 0 && etapaAtual === "produtos" && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                <div className="space-y-2">
                  {itens.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.nomeProduto}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.quantidade.toFixed(2).replace(".", ",")} × {formatCurrency(item.precoUnitario)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverItem(index)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Frete */}
          {etapaAtual === "produtos" && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="frete">Tem Frete?</Label>
                  <Switch
                    id="frete"
                    checked={temFrete}
                    onCheckedChange={setTemFrete}
                  />
                </div>

              {temFrete && (
                <>
                  <div>
                    <Label>Responsável pelo Frete</Label>
                    <RadioGroup
                      value={responsavelFrete}
                      onValueChange={setResponsavelFrete}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="loja" id="loja" />
                        <Label htmlFor="loja" className="font-normal cursor-pointer">
                          Loja
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="plataforma" id="plataforma-frete" />
                        <Label htmlFor="plataforma-frete" className="font-normal cursor-pointer">
                          Plataforma
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {responsavelFrete === "loja" && (
                    <div>
                      <Label htmlFor="valorFrete">Valor do Frete</Label>
                      <Input
                        id="valorFrete"
                        value={valorFrete}
                        onChange={(e) => handleCurrencyInput(e.target.value, setValorFrete)}
                        placeholder="0,00"
                        className="mt-2"
                      />
                    </div>
                  )}
                </>
              )}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {etapaAtual === "produtos" && (
            <Card>
              <CardContent className="p-4">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Digite observações sobre o pedido..."
                  className="mt-2"
                  rows={3}
                />
              </CardContent>
            </Card>
          )}

          {/* Resumo do Pedido */}
          {itens.length > 0 && etapaAtual === "produtos" && (
            <Card className="bg-primary/10 border-primary/30 shadow-lg">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                  <span className="text-base font-semibold text-foreground">Subtotal dos Itens</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(itens.reduce((acc, item) => acc + item.subtotal, 0))}
                  </span>
                </div>
                
                {temFrete && responsavelFrete === "loja" && valorFrete && (
                  <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                    <span className="text-base font-semibold text-foreground">Frete</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(parseCurrencyToDecimal(valorFrete))}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl font-bold text-foreground">TOTAL DO PEDIDO</span>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(calcularTotal())}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </div>
      </main>

      {/* Footer Button */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleFecharPedido}
            className="w-full h-12 text-base font-semibold"
            disabled={itens.length === 0}
          >
            Fechar Pedido
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default NovoPedido;
