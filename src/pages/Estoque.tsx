import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCentsToBRL, parseBRLToCents } from "@/lib/monetary";
import { formatNumber, handleCurrencyInput, parseCurrencyToDecimal } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ItemEstoque {
  id: string;
  tipo: "produto" | "insumo";
  nome: string;
  codigo?: string;
  unidade: string;
  quantidadeAtual: number;
  ultimaMovimentacao?: string;
  precoVenda?: number;
  custoProducao?: number;
  margem?: number;
}

interface Movimentacao {
  id: string;
  itemId: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  data: string;
  observacao?: string;
  origem?: "pedido" | "manual";
  pedidoId?: string;
}

const Estoque = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [itensEstoque, setItensEstoque] = useState<ItemEstoque[]>([]);
  const [movimentacaoDialogOpen, setMovimentacaoDialogOpen] = useState(false);
  const [tipoMovimentacaoDialogOpen, setTipoMovimentacaoDialogOpen] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<"entrada" | "saida">("entrada");
  const [selectedItem, setSelectedItem] = useState<ItemEstoque | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [editingMargemId, setEditingMargemId] = useState<string | null>(null);
  const [margemEditValue, setMargemEditValue] = useState("");

  // Carregar dados do estoque
  useEffect(() => {
    carregarEstoque();
  }, []);

  const carregarEstoque = () => {
    const produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
    const insumos = JSON.parse(localStorage.getItem("insumos") || "[]");
    const estoqueData = JSON.parse(localStorage.getItem("estoque") || "{}");
    const movimentacoes = JSON.parse(localStorage.getItem("movimentacoes") || "[]");

    const itens: ItemEstoque[] = [];

    // Adicionar produtos
    produtos.forEach((produto: any) => {
      const quantidadeAtual = estoqueData[`produto-${produto.id}`] || 0;
      const ultimaMov = movimentacoes
        .filter((m: Movimentacao) => m.itemId === `produto-${produto.id}`)
        .sort((a: Movimentacao, b: Movimentacao) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

      itens.push({
        id: `produto-${produto.id}`,
        tipo: "produto",
        nome: produto.nome,
        codigo: produto.codigo,
        unidade: produto.unidadeMedida,
        quantidadeAtual,
        ultimaMovimentacao: ultimaMov ? new Date(ultimaMov.data).toLocaleDateString() : "-",
        precoVenda: produto.precoVenda,
        custoProducao: produto.custoProducao,
        margem: produto.margem,
      });
    });

    // Adicionar insumos
    insumos.forEach((insumo: any) => {
      const quantidadeAtual = estoqueData[`insumo-${insumo.id}`] || 0;
      const ultimaMov = movimentacoes
        .filter((m: Movimentacao) => m.itemId === `insumo-${insumo.id}`)
        .sort((a: Movimentacao, b: Movimentacao) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

      itens.push({
        id: `insumo-${insumo.id}`,
        tipo: "insumo",
        nome: insumo.nome,
        codigo: insumo.codigo,
        unidade: insumo.unidade,
        quantidadeAtual,
        ultimaMovimentacao: ultimaMov ? new Date(ultimaMov.data).toLocaleDateString() : "-",
      });
    });

    setItensEstoque(itens);
  };

  const handleNovoMovimento = () => {
    setTipoMovimentacaoDialogOpen(true);
  };

  const handleSelecionarTipoMovimentacao = (tipo: "entrada" | "saida") => {
    setTipoMovimentacao(tipo);
    setTipoMovimentacaoDialogOpen(false);
    setMovimentacaoDialogOpen(true);
  };

  const handleSalvarMovimentacao = () => {
    if (!selectedItem) {
      toast({
        title: "Erro",
        description: "Selecione um item",
        variant: "destructive",
      });
      return;
    }

    const qtd = parseFloat(quantidade);
    if (!qtd || qtd <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade inválida",
        variant: "destructive",
      });
      return;
    }

    const estoqueData = JSON.parse(localStorage.getItem("estoque") || "{}");
    const movimentacoes = JSON.parse(localStorage.getItem("movimentacoes") || "[]");

    const quantidadeAtual = estoqueData[selectedItem.id] || 0;
    const novaQuantidade = tipoMovimentacao === "entrada" 
      ? quantidadeAtual + qtd 
      : quantidadeAtual - qtd;

    if (novaQuantidade < 0) {
      toast({
        title: "Erro",
        description: "Quantidade em estoque insuficiente",
        variant: "destructive",
      });
      return;
    }

    // Atualizar estoque
    estoqueData[selectedItem.id] = novaQuantidade;
    localStorage.setItem("estoque", JSON.stringify(estoqueData));

    // Registrar movimentação
    const novaMovimentacao: Movimentacao = {
      id: Date.now().toString(),
      itemId: selectedItem.id,
      tipo: tipoMovimentacao,
      quantidade: qtd,
      data: new Date().toISOString(),
      observacao: observacao || undefined,
      origem: "manual",
    };
    movimentacoes.push(novaMovimentacao);
    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));

    // Se for saída de produto com ficha técnica, deduzir insumos
    if (tipoMovimentacao === "saida" && selectedItem.tipo === "produto") {
      deduzirInsumosDoEstoque(selectedItem.id.replace("produto-", ""), qtd);
    }

    toast({
      title: "Sucesso",
      description: `${tipoMovimentacao === "entrada" ? "Entrada" : "Saída"} registrada com sucesso`,
    });

    // Limpar formulário e recarregar
    setSelectedItem(null);
    setQuantidade("");
    setObservacao("");
    setMovimentacaoDialogOpen(false);
    carregarEstoque();
  };

  const deduzirInsumosDoEstoque = (produtoId: string, quantidadeProduto: number) => {
    const produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
    const produto = produtos.find((p: any) => p.id === produtoId);

    if (!produto || !produto.fichaTecnica || produto.fichaTecnica.length === 0) {
      return;
    }

    const estoqueData = JSON.parse(localStorage.getItem("estoque") || "{}");
    const movimentacoes = JSON.parse(localStorage.getItem("movimentacoes") || "[]");
    const quantoRende = produto.quantoRende || 1;

    produto.fichaTecnica.forEach((insumoVinculado: any) => {
      const quantidadeNecessaria = (insumoVinculado.quantidade * quantidadeProduto) / quantoRende;
      const insumoId = `insumo-${insumoVinculado.insumoId}`;
      const quantidadeAtual = estoqueData[insumoId] || 0;
      const novaQuantidade = Math.max(0, quantidadeAtual - quantidadeNecessaria);

      estoqueData[insumoId] = novaQuantidade;

      // Registrar movimentação automática do insumo
      const movimentacaoInsumo: Movimentacao = {
        id: Date.now().toString() + "-" + insumoVinculado.insumoId,
        itemId: insumoId,
        tipo: "saida",
        quantidade: quantidadeNecessaria,
        data: new Date().toISOString(),
        observacao: `Dedução automática - Produção de ${produto.nome}`,
        origem: "manual",
      };
      movimentacoes.push(movimentacaoInsumo);
    });

    localStorage.setItem("estoque", JSON.stringify(estoqueData));
    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
  };

  const handleEditMargem = (item: ItemEstoque) => {
    setEditingMargemId(item.id);
    setMargemEditValue(item.margem ? item.margem.toString().replace('.', ',') : '');
  };

  const handleSaveMargem = (item: ItemEstoque) => {
    if (!margemEditValue) {
      setEditingMargemId(null);
      return;
    }

    const novaMargem = parseFloat(margemEditValue.replace(',', '.'));
    
    if (isNaN(novaMargem)) {
      toast({
        title: "Erro",
        description: "Margem inválida",
        variant: "destructive",
      });
      return;
    }

    const produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
    const produtoId = item.id.replace("produto-", "");
    const produtoIndex = produtos.findIndex((p: any) => p.id === produtoId);

    if (produtoIndex !== -1) {
      produtos[produtoIndex].margem = novaMargem;
      localStorage.setItem("produtos", JSON.stringify(produtos));
      
      toast({
        title: "Sucesso",
        description: "Margem atualizada com sucesso",
      });

      setEditingMargemId(null);
      setMargemEditValue("");
      carregarEstoque();
    }
  };

  const handleCancelEditMargem = () => {
    setEditingMargemId(null);
    setMargemEditValue("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cadastros")}
            className="hover:bg-muted min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>

          <h1 className="text-base sm:text-lg font-bold text-primary">
            Estoque
          </h1>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNovoMovimento}
            className="hover:bg-muted min-w-[44px] min-h-[44px]"
          >
            <Plus className="h-6 w-6 text-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 safe-area-bottom">{/* ... keep existing code */}
        <div className="max-w-6xl mx-auto space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd. Atual</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Preço Venda</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Margem %</TableHead>
                      <TableHead>Última Mov.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensEstoque.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhum item cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      itensEstoque.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.nome}
                            {item.codigo && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({item.codigo})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.tipo === "produto" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {item.tipo === "produto" ? "Produto" : "Insumo"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatNumber(item.quantidadeAtual, 3)}
                          </TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell className="text-right">
                            {item.tipo === "produto" && item.precoVenda 
                              ? `R$ ${formatNumber(item.precoVenda, 3)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.tipo === "produto" && item.custoProducao 
                              ? `R$ ${formatNumber(item.custoProducao, 3)}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.tipo === "produto" ? (
                              editingMargemId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="text"
                                    value={margemEditValue}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d,]/g, '');
                                      setMargemEditValue(value);
                                    }}
                                    className="h-8 w-20 text-right"
                                    placeholder="0,00"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveMargem(item);
                                      if (e.key === 'Escape') handleCancelEditMargem();
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleSaveMargem(item)}
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={handleCancelEditMargem}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditMargem(item)}
                                  className="hover:bg-muted rounded px-2 py-1 transition-colors"
                                >
                                  {item.margem ? `${formatNumber(item.margem, 2)}%` : "-"}
                                </button>
                              )
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.ultimaMovimentacao}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog: Escolher Tipo de Movimentação */}
      <Dialog open={tipoMovimentacaoDialogOpen} onOpenChange={setTipoMovimentacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tipo de Movimentação</DialogTitle>
            <DialogDescription>
              Selecione o tipo de movimentação que deseja registrar
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => handleSelecionarTipoMovimentacao("entrada")}
              className="h-24 flex-col gap-2"
              variant="outline"
            >
              <TrendingUp className="h-8 w-8 text-green-600" />
              <span className="font-semibold">Entrada</span>
            </Button>
            <Button
              onClick={() => handleSelecionarTipoMovimentacao("saida")}
              className="h-24 flex-col gap-2"
              variant="outline"
            >
              <TrendingDown className="h-8 w-8 text-red-600" />
              <span className="font-semibold">Saída</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Movimentação */}
      <Dialog open={movimentacaoDialogOpen} onOpenChange={setMovimentacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tipoMovimentacao === "entrada" ? "Entrada" : "Saída"} de Estoque
            </DialogTitle>
            <DialogDescription>
              Registre a movimentação de estoque
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Item</label>
              <select
                value={selectedItem?.id || ""}
                onChange={(e) => {
                  const item = itensEstoque.find((i) => i.id === e.target.value);
                  setSelectedItem(item || null);
                }}
                className="w-full h-10 px-3 border border-input rounded-md"
              >
                <option value="">Selecione um item</option>
                {itensEstoque.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} ({item.tipo === "produto" ? "Produto" : "Insumo"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quantidade</label>
              <Input
                type="text"
                value={quantidade}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, '');
                  setQuantidade(value);
                }}
                placeholder="0,000"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Observação (opcional)</label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Digite uma observação..."
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovimentacaoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarMovimentacao}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
