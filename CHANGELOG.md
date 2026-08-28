# Histórico de versões

## 2.3.0 - 28/08/2026

- corrige os botões `X` e `Cancelar` do formulário, que eram bloqueados pela validação do campo obrigatório;
- adiciona fechamento por toque fora do modal e pela tecla Escape;
- limita campos de data, horário, seleção e texto à largura real do modal no iPhone;
- reorganiza o formulário em uma coluna e adiciona rodapé de ações fixo durante a rolagem;
- aumenta áreas de toque e melhora o comportamento com o teclado aberto;
- adiciona padding aos avatares e corrige recortes dos emojis;
- centraliza o símbolo `+` no botão de nova atividade;
- revisa largura, quebra de texto e responsividade nas telas Hoje, Semana, Provas, Família e Ajustes;
- elimina carregamento duplicado da camada mobile;
- atualiza o cache da PWA.

## 2.2.1 - 28/08/2026

- impede o zoom automático do Safari ao focar campos do formulário;
- define tamanho mínimo de 16 px para `input`, `select` e `textarea` no mobile;
- limita a escala da viewport e evita rolagem horizontal durante a digitação;
- ajusta os diálogos para permanecerem dentro da largura da tela;
- atualiza o cache da PWA.

## 2.2.0 - 28/08/2026

- remove automaticamente a atividade demonstrativa de judô e referências a kimono;
- migra dados já salvos no navegador para excluir essa atividade;
- renomeia o perfil `Pai` para `Fábio` em avatares, responsáveis e modos de visualização;
- altera a indicação de permanência para `Casa do Fábio`;
- normaliza dados antigos recebidos do calendário ou da futura sincronização;
- ativa explicitamente a camada visual mobile no HTML principal;
- atualiza o cache da PWA.

## 2.1.0 - 28/08/2026

- redesenha a experiência mobile com foco em crianças com TDAH;
- adiciona barra de perfil e avatares visuais da família;
- adiciona faixa semanal compacta e filtros por manhã, tarde e noite;
- transforma o foco atual em uma jornada visual com progresso diário;
- adiciona pontos por tipo de atividade e catálogo de recompensas familiares;
- adiciona registro visual de humor sem interpretação clínica;
- reorganiza cartões, checkboxes e navegação para uso com uma mão;
- mantém o painel desktop e a lógica de dados existentes;
- atualiza o cache da PWA e valida o JavaScript antes do deploy.

## 2.0.1 - 28/08/2026

- corrige o evento FB & Família de domingo para sábado, 29/08/2026;
- migra automaticamente dados já salvos no aparelho;
- corrige também cópias antigas recebidas da sincronização em nuvem;
- atualiza o cache da PWA para distribuir a correção no iPhone.

## 2.0.0 - 28/08/2026

- adiciona camada opcional de nuvem com Firebase Authentication e Firestore;
- permite autorizar familiares por e-mail;
- prepara sincronização compartilhada dos checklists;
- conecta o calendário Google `Filhos`;
- interpreta eventos `Fábio` como período na casa do pai;
- cria lembretes no Google Agenda com 24 horas e 2 horas de antecedência;
- mantém o modo local e offline quando a nuvem não estiver disponível;
- adiciona validação automática de JavaScript antes do deploy.
