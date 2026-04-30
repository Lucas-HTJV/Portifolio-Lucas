# &lt;lucas.dev/&gt; — Portfólio Pessoal

> Portfólio de **Lucas Lima de Sousa** — Desenvolvedor Front-End apaixonado por criar interfaces que unem estética e funcionalidade.

---

## 🖥️ Preview

![Hero Section](https://via.placeholder.com/900x450/0f0f17/a855f7?text=lucas.dev+%E2%80%94+Front-End+Developer)

---

## ✨ Funcionalidades

- **Design responsivo** — adaptado para desktop e mobile com menu hamburguer
- **Animações suaves** — efeitos de scroll reveal, typewriter e cursor piscando
- **Canvas de fundo animado** — chuva de binários ao estilo matrix na seção hero
- **Seção de projetos dinâmica** — projetos adicionados e gerenciados pelo painel admin
- **Painel Admin protegido** — acesso via senha com hash SHA-256 (Web Crypto API)
- **Upload de foto de perfil** — foto aplicada ao hero e à seção "Sobre" via painel
- **Projetos com capa, tags, links e arquivos** — gerenciamento completo sem backend
- **Persistência via localStorage** — dados e foto salvos no navegador
- **Segurança básica** — Content Security Policy, X-Frame-Options e no-referrer configurados

---

## 🛠️ Tecnologias

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

- **HTML5** — estrutura semântica e acessível
- **CSS3** — variáveis CSS, Grid, Flexbox, animações e media queries
- **JavaScript puro** — sem frameworks, sem dependências externas
- **Web Crypto API** — hash SHA-256 para autenticação do admin
- **localStorage** — persistência de projetos e foto de perfil
- **Google Fonts** — Fraunces, DM Sans e JetBrains Mono

---

## 📁 Estrutura do Projeto

```
portfolio/
├── portfolio.html   # Estrutura da página (nav, hero, about, projects, contact)
├── portfolio.css    # Estilos, variáveis, animações e responsividade
└── portfolio.js     # Lógica: admin, projetos, foto, animações e interações
```

---

## 🚀 Como usar localmente

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Lucas-HTJV/portfolio.git
   cd portfolio
   ```

2. **Abra o arquivo HTML diretamente no navegador**
   ```bash
   # Opção 1 — abrindo direto
   open portfolio.html

   # Opção 2 — com Live Server (VS Code)
   # Instale a extensão Live Server e clique em "Go Live"
   ```

> Nenhuma instalação de dependências necessária. O projeto roda 100% no front-end.

---

## 🔐 Painel Admin

O portfólio possui um painel de administração discreto para gerenciar conteúdo sem precisar editar o código.

**Como acessar:**
1. Clique no ícone de usuário discreto no canto inferior direito da página
2. Digite a senha de administrador
3. Gerencie projetos e foto de perfil pelas abas do painel

**Funcionalidades do painel:**
- ➕ Adicionar, editar e remover projetos
- 🖼️ Upload de capa para cada projeto
- 🏷️ Adicionar tags, links do GitHub e links ao vivo
- 📷 Upload da foto de perfil (aparece no hero e no "Sobre")

> A senha é protegida por **SHA-256** via Web Crypto API — não é armazenada em texto puro no código.

---

## 📬 Contato

| Canal | Link |
|---|---|
| 📧 Email | [lucaslimadesousa5@gmail.com](mailto:lucaslimadesousa5@gmail.com) |
| 💼 LinkedIn | [linkedin.com/in/lucas-lima-180573390](https://www.linkedin.com/in/lucas-lima-180573390/) |
| 🐙 GitHub | [github.com/Lucas-HTJV](https://github.com/Lucas-HTJV) |
| 📸 Instagram | [@dev_lucas07](https://www.instagram.com/dev_lucas07/) |
| 💬 WhatsApp | [+55 11 95619-4625](https://wa.me/5511956194625) |

---

## 📄 Licença

Este projeto é de uso pessoal. Sinta-se à vontade para se inspirar, mas evite copiar diretamente para seu próprio portfólio. 😄

---

<p align="center">
  Feito com 💜 por <strong>Lucas Lima de Sousa</strong>
</p>
