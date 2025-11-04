#!/usr/bin/env node

// PROBLEMA: Dado um array de moedas e um valor, qual o número MÍNIMO de moedas
// necessárias para formar esse valor?
//
// EXEMPLO: coins = [1, 2, 5], amount = 11
// Posso formar 11 de várias formas:
// - 11 moedas de 1 (11 moedas)
// - 5 moedas de 2 + 1 moeda de 1 (6 moedas)
// - 2 moedas de 5 + 1 moeda de 1 (3 moedas) <- MELHOR!
// Resposta: 3 moedas
//
// SOLUÇÃO: Programação dinâmica
// Crio um array onde cada posição guarda o menor número de moedas
// necessário para formar aquele valor. Depois preencho esse array
// de baixo pra cima (dos valores menores pros maiores).

function coinChange(coins, amount) {
    // Se o valor é 0, não preciso de nenhuma moeda
    if (amount === 0) return 0;

    // dp[i] vai guardar o menor número de moedas pra formar o valor i
    // Começamos tudo como null (ainda não sabemos como formar)
    const dp = Array(amount + 1).fill(null);
    dp[0] = 0; // pra formar 0, preciso de 0 moedas

    // Para cada valor de 1 até o amount
    for (let i = 1; i <= amount; i++) {
        for (const coin of coins) {
            // só faz sentido usar a moeda se ela for menor ou igual ao valor atual
            if (coin <= i && dp[i - coin] !== null) {
                const novoTotal = dp[i - coin] + 1; // usa 1 moeda a mais
                // Se ainda não existe um valor pra dp[i], ou achamos um menor
                if (dp[i] === null || novoTotal < dp[i]) {
                    dp[i] = novoTotal;
                }
            }
        }
    }

    // Se não conseguimos formar o valor, devolve -1
    return dp[amount] === null ? -1 : dp[amount];
}

// Parte que lê a entrada
let dados = '';
process.stdin.setEncoding('utf8');

// Junta o que vem da entrada padrão
process.stdin.on('data', chunk => {
    dados += chunk;
});

// Quando terminar de ler a entrada
process.stdin.on('end', () => {
    try {
        const entrada = JSON.parse(dados.trim());
        const { coins, amount } = entrada;

        const resultado = coinChange(coins, amount);

        // Saída no formato exigido
        console.log(JSON.stringify({ minCoins: resultado }));
    } catch (erro) {
        console.error(JSON.stringify({ error: erro.message }));
        process.exit(1);
    }
});
