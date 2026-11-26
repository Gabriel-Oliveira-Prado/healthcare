
import { useState } from "react";
import {
  healthCategories,
  type HealthCategoryId,
} from "../../data/healthContent";
import "./health.css";

export default function HealthContent() {
  const [selectedCategory, setSelectedCategory] =
    useState<HealthCategoryId | null>(null);

  const category = healthCategories.find(
    (item) => item.id === selectedCategory
  );

  return (
    <div className="portal-page health-page">
      <div className="portal-page-heading">
        <span className="portal-eyebrow">EDUCAÇÃO EM SAÚDE</span>
        <h1>Conteúdos de Saúde</h1>
        <p>
          Informações e orientações para ajudar você a cuidar melhor da sua saúde.
        </p>
      </div>

      {!category && (
        <section className="health-intro portal-panel">
          <div>
            <span className="health-intro-label">
              INFORMAÇÃO E PREVENÇÃO
            </span>
            <h2>Conhecimento também é cuidado.</h2>
            <p>
              Explore conteúdos sobre hábitos saudáveis, bem-estar e prevenção.
              Encontre informações organizadas para diferentes áreas da saúde.
            </p>
          </div>
          <i className="bi bi-heart-pulse" aria-hidden="true" />
        </section>
      )}

      {!category ? (
        <section className="health-section">
          <div className="health-section-heading">
            <div>
              <span className="portal-eyebrow">EXPLORE</span>
              <h2>Áreas de conhecimento</h2>
              <p>Selecione uma categoria para acessar seus conteúdos.</p>
            </div>
          </div>

          <div className="row g-3">
            {healthCategories.map((item) => (
              <div className="col-sm-6 col-xl-3" key={item.id}>
                <button
                  type="button"
                  className="health-category-card"
                  onClick={() => setSelectedCategory(item.id)}
                >
                  <span className={`health-category-icon ${item.tone}`}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                  </span>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <span className="health-card-link">
                    Explorar conteúdos
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          <button
            type="button"
            className="health-back-link"
            onClick={() => setSelectedCategory(null)}
          >
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Voltar aos conteúdos
          </button>

          <section className="health-category-banner portal-panel">
            <span className={`health-category-icon ${category.tone}`}>
              <i className={`bi ${category.icon}`} aria-hidden="true" />
            </span>
            <div>
              <h2>Explore esta categoria</h2>
              <p>
                Confira os materiais disponíveis e conheça mais sobre este tema.
              </p>
            </div>
          </section>

          <section className="health-section">
            <div className="health-section-heading">
              <div>
                <span className="portal-eyebrow">BIBLIOTECA DE CONTEÚDOS</span>
                <h2>{category.title}</h2>
                <p>
                  {category.articles.length} conteúdos disponíveis
                </p>
              </div>
            </div>

            <div className="row g-3">
              {category.articles.map((article) => (
                <div className="col-md-6" key={article.id}>
                  <article className="health-article-card">
                    <span className="health-article-category">
                      {category.title}
                    </span>

                    <h3>{article.title}</h3>
                    <p>{article.description}</p>

                    <div className="health-article-footer">
                      <div className="topic-tags">
                        {article.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>

                      <span className="health-reading-time">
                        <i className="bi bi-clock" aria-hidden="true" />
                        {article.readingTime}
                      </span>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </section>

          <section className="health-other-categories">
            <h2>Conheça outras áreas</h2>
            <div className="topic-tags">
              {healthCategories
                .filter((item) => item.id !== category.id)
                .map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedCategory(item.id)}
                  >
                    {item.title}
                  </button>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
