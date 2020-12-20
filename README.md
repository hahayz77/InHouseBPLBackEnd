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
- [ x ] Reportar erro na partida não finalizado;
- [ ] Histórico de partidas;
- [ ] Substituir name por objeto no emit do front end para fazer o matchmaking;
- [ ] Jogadores com pontos negativos tem redução na subtração dos pontos para estimular a pontuação positiva no ranking;
- [ ] Opções de Matchmaking -> Winrate + random, Pontos + random;

### Problemas

- Muita pontuação negativa no ranking;
- Partidas desbalanceadas;


