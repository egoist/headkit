import { render } from "react-dom"
import { Head, HeadProvider, createHeadManager } from "@headkit/react"
import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import { useState } from "react"

const Home = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <Head>
        <title>{count}home</title>
        <style>{`body {background:red}`}</style>
        <script dangerouslySetInnerHTML={{ __html: `console.log(1)` }}></script>
      </Head>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <Link to="/about">about</Link>
    </div>
  )
}

const About = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <Head>
        <title>{count}about</title>
        <style>{`body {background:green}`}</style>
        <script dangerouslySetInnerHTML={{ __html: `console.log(2)` }}></script>
      </Head>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <Link to="/">home</Link>
    </div>
  )
}

const App = () => {
  return (
    <HeadProvider value={createHeadManager()}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </BrowserRouter>
    </HeadProvider>
  )
}

render(<App />, document.getElementById("app"))
