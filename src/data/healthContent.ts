
export type HealthCategoryId =
  | "alimentacao"
  | "atividade-fisica"
  | "saude-mental"
  | "prevencao";

export interface HealthArticle {
  id: number;
  title: string;
  description: string;
  readingTime: string;
  tags: string[];
}

export interface HealthCategory {
  id: HealthCategoryId;
  title: string;
  description: string;
  icon: string;
  tone: string;
  articles: HealthArticle[];
}

export const healthCategories: HealthCategory[] = [
  {
    id: "alimentacao",
    title: "Alimentação e Nutrição",
    description:
      "Conheça os princípios de uma alimentação equilibrada e seus benefícios para a saúde.",
    icon: "bi-apple",
    tone: "green",
    articles: [
      {
        id: 1,
        title: "Princípios de uma alimentação equilibrada",
        description:
          "Entenda a importância da variedade de alimentos e de refeições equilibradas.",
        readingTime: "5 min",
        tags: ["Nutrição", "Alimentação"]
      },
      {
        id: 2,
        title: "A importância da hidratação",
        description:
          "Conheça o papel da água no funcionamento do organismo e na manutenção da saúde.",
        readingTime: "3 min",
        tags: ["Hidratação", "Bem-estar"]
      }
    ]
  },
  {
    id: "atividade-fisica",
    title: "Atividade Física",
    description:
      "Informações sobre movimento, exercícios e benefícios da atividade física regular.",
    icon: "bi-activity",
    tone: "coral",
    articles: [
      {
        id: 3,
        title: "Benefícios da atividade física",
        description:
          "Descubra como o movimento regular contribui para a saúde física e mental.",
        readingTime: "5 min",
        tags: ["Exercícios", "Qualidade de vida"]
      },
      {
        id: 4,
        title: "Como reduzir o sedentarismo",
        description:
          "Pequenas mudanças na rotina podem aumentar seus níveis de atividade.",
        readingTime: "4 min",
        tags: ["Prevenção", "Movimento"]
      }
    ]
  },
  {
    id: "saude-mental",
    title: "Saúde Mental",
    description:
      "Explore informações sobre bem-estar emocional, autocuidado e saúde psicológica.",
    icon: "bi-heart-pulse",
    tone: "purple",
    articles: [
      {
        id: 5,
        title: "A importância do autocuidado",
        description:
          "Conheça práticas cotidianas que podem contribuir para o bem-estar emocional.",
        readingTime: "4 min",
        tags: ["Autocuidado", "Bem-estar"]
      },
      {
        id: 6,
        title: "Sono e saúde mental",
        description:
          "Entenda a relação entre qualidade do sono, emoções e saúde psicológica.",
        readingTime: "5 min",
        tags: ["Sono", "Saúde mental"]
      }
    ]
  },
  {
    id: "prevencao",
    title: "Prevenção e Cuidados",
    description:
      "Informações introdutórias sobre prevenção de doenças e acompanhamento da saúde.",
    icon: "bi-shield-check",
    tone: "blue",
    articles: [
      {
        id: 7,
        title: "A importância da vacinação",
        description:
          "Entenda como a vacinação contribui para a proteção individual e coletiva.",
        readingTime: "4 min",
        tags: ["Vacinação", "Prevenção"]
      },
      {
        id: 8,
        title: "Consultas e exames preventivos",
        description:
          "Saiba por que o acompanhamento de saúde deve considerar suas necessidades individuais.",
        readingTime: "5 min",
        tags: ["Acompanhamento", "Prevenção"]
      }
    ]
  }
];
