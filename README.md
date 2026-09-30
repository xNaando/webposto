# webPosto — Central de Treinamento

Site de tutoriais em vídeo do sistema webPosto, para treinar clientes e equipes. Feito com React + Vite, roda 100% no navegador e funciona no GitHub Pages.

## O que tem

- **Trilhas em vídeo** — playlists do YouTube curadas: primeiros passos, treinamento completo, frente de caixa e gestão.
- **Player embutido** — assista sem sair da página, com lista de aulas, duração e navegação Anterior/Próximo.
- **Progresso salvo** — marque aulas como assistidas; o avanço fica em `localStorage` e vira barra de progresso em cada trilha.
- **Retomada automática** — ao abrir uma trilha, ela continua da primeira aula não assistida.
- **Busca e filtros** — encontre trilhas por nome, canal ou categoria.
- **Playlists extras** — cole qualquer link de playlist/vídeo do YouTube para adicionar à sua biblioteca.

## Rodar local

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/
npm run preview  # testa o build
```

## Deploy (GitHub Pages)

O workflow `.github/workflows/deploy.yml` faz build + deploy automático a cada push na `main`.

**Configuração manual necessária (uma vez):**

1. No GitHub, vá em **Settings → Pages**
2. Em **Build and deployment → Source**, selecione **GitHub Actions**
3. Faça push para a `main` — o deploy acontece sozinho

O site fica em `https://xnaando.github.io/webposto/`.

## Estrutura

```
src/
  store.js      # progresso + playlists extras (localStorage) + hook useStore
  youtube.js    # YouTube Data API v3 com cache em localStorage
  utils.js      # parser de URLs do YouTube, duração ISO8601, helpers
  data/
    playlists.js        # trilhas curadas
  components/
    Icon.jsx            # ícones SVG
    Home.jsx            # hero, filtros, busca e grade de trilhas
    AddCustom.jsx       # modal para adicionar playlist/vídeo por link
    PlaylistView.jsx    # player + lista de aulas + progresso
```
