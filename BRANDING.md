# Clínica Alvea — Identidade de Marca

> Documento de referência de branding para o projeto **Sistema de Agendamento — Clínica de Saúde**

---

## 1. Sobre a clínica

**Nome:** Clínica Alvea
**Slogan:** "Tecnologia que respira cuidado."

A Clínica Alvea é uma clínica de saúde (fictícia, criada para fins acadêmicos) que oferece atendimento médico, exames laboratoriais e de imagem, aconselhamento nutricional e outros procedimentos de cuidado à saúde. A plataforma digital apresentada neste projeto é o sistema próprio da clínica para agendamento, acompanhamento de exames e gestão administrativa — não um produto de terceiros.

---

## 2. Missão, Visão e Valores

### Missão
Oferecer cuidado de saúde acessível, humano e sem burocracia, unindo profissionais qualificados a uma experiência digital simples para cada paciente.

### Visão
Ser a clínica de referência na região pela qualidade do atendimento e pela facilidade de cuidar da própria saúde através da nossa plataforma.

### Valores
- **Cuidado em primeiro lugar** — cada atendimento e cada decisão pensam no bem-estar real do paciente
- **Segurança e privacidade** — dados de saúde tratados com o máximo rigor e sigilo
- **Simplicidade** — agendar, consultar e acompanhar exames sem burocracia
- **Confiabilidade** — horários cumpridos, resultados entregues no prazo, comunicação transparente
- **Evolução contínua** — melhoria constante do atendimento e da experiência do paciente

---

## 3. Identidade Visual

### Paleta de cores

| Cor | Hex | Uso |
|---|---|---|
| Azul Alvea (primária) | `#0F6E8C` | Header, títulos de destaque, botão CTA principal |
| Verde Vida (secundária) | `#3FA796` | Ícones, badges, confirmações, elementos de destaque secundário |
| Branco Quente (fundo) | `#FDFCFA` | Fundo principal |
| Cinza Suave (fundo alternativo) | `#F4F6F8` | Fundos de seção alternados, cards |
| Vermelho Atenção | `#E15554` | Erros, cancelamentos, alertas |
| Cinza Texto | `#333333` | Texto principal |

### Variáveis CSS

```css
:root {
  /* Cores primárias */
  --alvea-blue: #0F6E8C;
  --alvea-blue-dark: #0B5570;
  --alvea-blue-light: #E6F1F5;

  /* Cores secundárias */
  --alvea-green: #3FA796;
  --alvea-green-dark: #2F8578;
  --alvea-green-light: #E7F5F2;

  /* Fundos */
  --alvea-bg: #FDFCFA;
  --alvea-bg-alt: #F4F6F8;

  /* Feedback */
  --alvea-danger: #E15554;
  --alvea-danger-light: #FCEBEB;
  --alvea-success: #3FA796;

  /* Texto */
  --alvea-text: #333333;
  --alvea-text-muted: #6B7280;
  --alvea-white: #FFFFFF;

  /* Tipografia */
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Bordas / raio (estilo pill, inspirado na referência visual) */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-pill: 999px;

  /* Sombra suave para cards */
  --shadow-card: 0 4px 20px rgba(15, 110, 140, 0.08);
}
```

### Tipografia

- **Títulos:** Poppins (600/700) — via Google Fonts
- **Corpo de texto:** Inter (400/500) — via Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### Conceito de logo

Símbolo minimalista de um pulso/batimento cardíaco (ECG) estilizado que se curva formando a letra **"A"** (inicial de Alvea). Gradiente do Azul Alvea (`#0F6E8C`) para o Verde Vida (`#3FA796`).

---

## 4. Referência visual de front-end

Layout de referência: site institucional no estilo "Mindthera" (clínica/wellness), adaptado à paleta Clínica Alvea.

**Elementos de estrutura aproveitados:**
- Header fixo com logo + menu horizontal + CTA em destaque ("Agendar Consulta")
- Hero com fotografia real + título grande + subtítulo + botão de ação
- Grid assimétrico de imagens (2x2, uma maior) para seção de serviços
- Bloco de credibilidade/avaliações
- Seção de depoimento de paciente (foto redonda + citação)
- Botões em formato pill (bordas bem arredondadas)
- Elementos gráficos orgânicos e sutis como assinatura visual (linha de pulso/ECG)

**Estrutura da landing page:**
1. Header
2. Hero (chamada principal + CTA)
3. Nossos Serviços (grid de imagens + descrição + botão "Saiba mais" por card)
4. Nossos Profissionais (grid com os médicos e especialistas da clínica)
5. Credibilidade / Avaliações
6. Planos (3 cards de planos personalizados)
7. Depoimentos (carrossel)
8. FAQ (perguntas frequentes em acordeão)
9. Footer (horário, endereço, contato, CTA final)

### Seção de Planos

Cards de planos personalizados, inspirados em modelo de pricing (cabeçalho colorido, destaque no card central, lista de benefícios com check, botão de ação):

| Plano | Público-alvo | Principais benefícios |
|---|---|---|
| **Consulta Avulsa** | Paciente individual, sem vínculo recorrente | 1 consulta médica, histórico digital, lembretes de retorno |
| **Plano Família** *(destaque)* | Famílias com uso frequente da clínica | Agendamento prioritário para até 4 membros, descontos em exames |
| **Plano Corporativo** | Empresas parceiras | Agendamento facilitado para colaboradores, exames periódicos, relatório de saúde ocupacional |

### Seção de FAQ

Formato acordeão (pergunta expande a resposta ao clicar). Perguntas sugeridas:

1. Quais serviços a clínica oferece?
2. Como faço para agendar uma consulta?
3. Posso escolher o profissional que vou consultar?
4. Como consulto ou cancelo um agendamento já feito?
5. Onde posso ver o resultado dos meus exames?
6. Meus dados de saúde estão seguros na plataforma?

---

## 5. Aplicação no sistema

Esta identidade deve ser aplicada de forma consistente em:
- Landing page institucional
- Telas de login/cadastro
- Área do paciente (agendamento, meus agendamentos, meus exames, perfil)
- Área administrativa (dashboard, gestão de profissionais, agendamentos, exames, pacientes)

Os componentes (botões, cards, inputs, badges de status) devem seguir a paleta e o raio de borda definidos acima para manter consistência visual em todo o sistema.
