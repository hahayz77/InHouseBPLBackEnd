# InHouseBPLBackEnd

------

## Estrutura básica do projeto
**database** (Conectar com o mongodb)
  > - mongodb.js 
  
**functions** (Funções do Socket)
  > - socketMatch.js
  > - matchInit.js
  > - matchUpdate.js
  
**models** (Schemas do mongodb)
  > - match.js
  > - Queue.js
  > - user.js
  > - problems.js
  
**routes** (Rotas do express)
  > - match.js
  > - queue.js
  > - user.js

**app.js** (Arquivo principal contendo o socketIO)

------

### O que falta fazer
- [x] Reportar erro na partida não finalizado;
- [x] Retirar IDs da queue;
- [x] Substituir name por objeto no emit do front end para fazer o matchmaking;
- [x] Jogadores com pontos negativos tem redução na subtração dos pontos;
- [x] Opções de Matchmaking -> trigger por resultados dos matches anteriores;
- [ ] Colocar espaço para Títulos na DB;
- [x] Ocultar nomes dos players na fila;
- [ ] Opção de Picks e Bans;
- [ ] Inserir players no começo da fila ao cancelar match;
- [x] Ocultar a Pontuação no ranking

### Problemas



