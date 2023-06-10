import { server } from "../App";

export default function Form() {
    return <form action={`${server}/edit_pl`} method="POST">
        <input name="token" value={"abcd"}></input>
        <input name="pid" value={"alkfsjaklfsj"}></input>
        <input type="file"></input>
        <button>Submit</button>
    </form>
}