import './App.css'
import { Route, Routes } from 'react-router-dom'
import Login, { serverRes } from './pages/login'
import Signup from './pages/signup'
import Cookie from 'js-cookie'
import Home from './pages/home'
import Layout from './pages/Layout'
import Search from './pages/search'
import LikedSongs from './pages/LikedSongs'
import CreatePlaylistView from './pages/CreatePlaylist'
import Library from './pages/Library'
import Form from './pages/form'
export const server = "http://localhost:8000"
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout></Layout>}>
          <Route index={true} element={<Search></Search>}></Route>
          <Route path="home" element={<Home></Home>}></Route>
          <Route path="search" element={<Search></Search>}></Route>
          <Route path="liked_songs" element={<LikedSongs></LikedSongs>}></Route>
          <Route path='create_playlist' element={<CreatePlaylistView></CreatePlaylistView>}></Route>
          <Route path='library' element={<Library></Library>}></Route>
          {/* <Route */}
        </Route>
        <Route path="/form" element={<Form></Form>}></Route>
        <Route path="/login" element={<Login></Login>}></Route>
        <Route path="/signup" element={<Signup></Signup>}></Route>
      </Routes>
    </>
  )
}



export async function Post<ResponseType>(url: string, body: string) {
  // console.log(body)
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: body
  })
  return await res.json() as Promise<ResponseType>
}


export function checkCookie(errRoute: string | false, sucRoute: string | false) {
  fetch(`${server}/check_cookie`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token: Cookie.get("token")
    })
  }).then(res => res.json()).then((data: serverRes) => {
    const { success } = data;
    if (!success) {
      if (errRoute) {

        window.location.href = errRoute;
      }
    } else {
      Cookie.set("token", Cookie.get("token") || "", { expires: 30 });
      if (sucRoute) {

        window.location.href = sucRoute;
      }
    }
  })
}

export default App
