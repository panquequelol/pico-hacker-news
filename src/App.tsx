import { Component, createSignal, onMount, For, createEffect } from "solid-js";
import axios from "axios";
import * as moment from "moment";

type Article = {
  by: string;
  descendants: number;
  id: number;
  score: number;
  time: number;
  title: string;
  type: string;
  url: string;
};

const App: Component = () => {
  const MAX_NUMBER_OF_ARTICLES = 500;
  const MAX_NUMBER_OF_CHUNKS = 25;

  const [currentArticlesChunk, setCurrentArticlesChunk] =
    createSignal<number>(0);
  const [articles, setArticles] = createSignal<Article[]>([]);
  const [articlesIdsByChunks, setArticlesIdsByChunks] = createSignal<
    number[][]
  >([]);

  function handleLoadMore() {
    if (currentArticlesChunk() < MAX_NUMBER_OF_CHUNKS) {
      setCurrentArticlesChunk((prev) => prev + 1);
    }
  }

  async function handleFetchArticles() {
    // Await all articles on array
    const fetchedArticles: Article[] = await Promise.all(
      articlesIdsByChunks()[currentArticlesChunk()].map(async (articleId) => {
        const { data: newArticle } = await axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${articleId}.json?print=pretty`
        );
        return newArticle;
      })
    );
    setArticles((prev) => [...prev, ...fetchedArticles]);
  }

  onMount(async () => {
    const { data: articleIds } = await axios.get(
      "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty"
    );

    const articlesIdsByChunks: number[][] = [];

    // Divide news articles ids in chunks of 20 items
    for (let i = 0; i < MAX_NUMBER_OF_ARTICLES; i += 20) {
      const chunk = articleIds.slice(i, i + 20);
      articlesIdsByChunks.push(chunk);
    }

    setArticlesIdsByChunks(articlesIdsByChunks); // make value accessable in other parts of the code
  });

  createEffect(() => {
    if (articlesIdsByChunks().length) handleFetchArticles();
  });

  return (
    <div class="container">
      <nav>
        <ul>
          <li>
            <strong>Pico Hacker News</strong>
          </li>
        </ul>
        <ul>
          <li>
            <a href="#" aria-disabled="true">
              Newest
            </a>
          </li>
          <li>
            <a href="#" aria-disabled="true">
              Jobs Stories
            </a>
          </li>
          <li>
            <a href="#" role="button">
              GitHub Repo
            </a>
          </li>
        </ul>
      </nav>
      <main>
        {articles().length ? (
          <For each={articles()}>
            {({ title, score, by, time, url }) => {
              const articleDate = new Date(time) as unknown as number; // in unix time
              const timePast = moment.unix(articleDate).fromNow();
              return (
                <article>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {title}
                  </a>
                  <p>{`${score} points by ${by} - ${timePast}`}</p>
                </article>
              );
            }}
          </For>
        ) : (
          [...Array(25)].map(() => <article aria-busy="true"></article>)
        )}
      </main>
      <button
        onclick={handleLoadMore}
        aria-busy={articles().length ? "false" : "true"}
        class={articles().length ? "" : "secondary"}
      >
        Load More
      </button>
    </div>
  );
};

export default App;
