# Coin Change - Solução

## Meu Raciocínio

O problema é encontrar o número **mínimo** de moedas necessárias para formar um valor determinado. 

A primeira ideia que tive foi tentar todas as combinações possíveis, mas isso seria muito lento. Então pensei em usar **programação dinâmica**.

### Ideia Principal

A ideia é resolver o problema de forma gradual, do menor para o maior:

1. Primeiro descobrir quantas moedas preciso para formar 1
2. Depois quantas preciso para formar 2
3. E assim por diante até chegar no valor que quero

### Como funciona

Para formar um valor qualquer, eu posso usar qualquer moeda disponível:
- Se uso uma moeda de 5 para formar 11, sobra 6
- Se já sei quantas moedas preciso para formar 6, só preciso somar +1 (a moeda que usei)
- Escolho a opção que usa **menos moedas no total**

### Exemplo prático

Com `coins = [1, 2, 5]` e `amount = 11`:

- Para formar 1: preciso de 1 moeda de 1
- Para formar 2: posso usar 1 moeda de 2 (melhor que 2 moedas de 1)
- Para formar 3: posso usar 1 moeda de 2 + 1 moeda de 1 = 2 moedas
- Para formar 11: posso usar 2 moedas de 5 + 1 moeda de 1 = 3 moedas ✓

### Implementação

Crio um array `dp` onde:
- `dp[i]` = número mínimo de moedas para formar o valor `i`
- Começo com `null` (ainda não sei a resposta)
- `dp[0] = 0` (caso base: para formar 0, preciso de 0 moedas)

Para cada valor de 1 até `amount`, tento usar cada moeda disponível e guardo a melhor solução encontrada.

Se no final `dp[amount]` ainda for `null`, significa que é impossível formar aquele valor, então retorno `-1`.

## Como rodar

### Testes locais

```bash
npm install
npm test
```

### Executar com Docker

Construir a imagem:

```bash
docker build -t coin-change .
```

Executar um caso de teste:

```bash
echo '{"coins":[1,2,5],"amount":11}' | docker run -i --rm coin-change
```

Saída esperada: `{"minCoins":3}`

### Executar manualmente

```bash
echo '{"coins":[1,2,5],"amount":11}' | node solution.js
```
