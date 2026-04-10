<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Сторінку не знайдено</p>
    <router-link to="/" class="home-link">На головну</router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  color: var(--text-secondary);
}

.not-found h1 {
  font-size: 72px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.not-found p {
  font-size: 18px;
  margin: 0 0 24px;
}

.home-link {
  padding: 10px 24px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;
}

.home-link:hover {
  background: var(--primary-hover);
}
</style>
