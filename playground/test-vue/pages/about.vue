<script lang="ts" setup>
import { Head } from "@headkit/vue"
import { ref } from "vue"

let count = ref(0)

const style = `
body {
  background: green;
}
`
</script>

<template>
  <div>
    <Head>
      <title>{{ count }}About</title>
      <meta name="description" :content="`${count}`" />
      <component is="style" v-html="style"></component>
    </Head>
    <button @click="count++">{{ count }}</button>
    <router-link to="/">Home</router-link>
  </div>
</template>
