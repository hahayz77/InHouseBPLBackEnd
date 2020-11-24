# InHouseBPLBackEnd

------

## Estrutura do projeto
**database** (Conectar com o mongodb)
  > - mongodb.js 
  
**functions** (Funções do Socket)

  > - socketMatch.js
  > - matchInit.js
  > - matchUpdate.js
  
  > ~~socketReports.js~~ **Retirado, bug que não carregava report da partida para concertar depois**
  
**models** (Schemas do mongodb)
  > - match.js
  > - Queue.js
  > - user.js
  
**routes** (Rotas do express)
  > - match.js
  > - queue.js
  > - user.js
**app.js** (Arquivo principal contendo o socketIO)

## Report
### App.js
#### O que falta fazer
- [ ] Alguma maneira de enviar ID dos players junto dos emits
- [ ] Contagem de número

#### Problemas

- functions/socketReport ->ReportInit acaba enviado report para todos os usuários, assim como os erros.
- Não consegui enviar para um usuário por uma sala ou ID.
- Tive que fazer o Report pelo express com a rota match REPORT e RESULT

### routes/match.js
#### O que falta fazer
- [ ] Jogadores com pontos negativos tem redução de subtração de pontos pela metade (Talvez)
