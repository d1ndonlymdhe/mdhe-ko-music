import { HeartIcon as HSolid } from "@heroicons/react/24/solid"
import { HeartIcon as HOutline } from "@heroicons/react/24/outline"
import { useState } from "react";
import { Post, server } from "../App";
import cookie from "js-cookie"
import { likedCtx, setLikedCtx } from "./GlobalContext";
type HearIconProps = {
    className?: string,
    is_liked: boolean
}
export function HeartIcon(props: HearIconProps) {
    const { is_liked, className } = props;
    if (is_liked) {
        return <HSolid className={`text-green-500 h-6 w-6 ${className ? className : ""}`}></HSolid>
    } else {
        return <HOutline className={`text-green-500 h-6 w-6 ${className ? className : ""}`}></HOutline>

    }
}

type LikeButtonProps = {
    is_liked: boolean,
    song_id: string,
    className?: string,
}


type LikeActionRes = {
    success: boolean,
    msg: {
        action: boolean,
        song_id: string,
    }
}


export default function LikeButton(props: LikeButtonProps) {
    const { className, song_id } = props;
    const likedSongs = likedCtx()
    const setLikedSongs = setLikedCtx()
    const [likedState, setLikedState] = useState(likedSongs.has(song_id))
    function unLike() {
        let temp = new Set(likedSongs);
        temp.delete(song_id);
        setLikedSongs(temp);
        setLikedState(false);
    }
    function like() {
        setLikedSongs((new Set(likedSongs)).add(song_id))
        setLikedState(true)
    }
    function handleClick() {
        setLikedState(!likedState);
        if (likedState) {
            unLike()
        } else {
            like()
        }
        // setLikedSongs((new Set(likedSongs)).add(song_id));
        Post<LikeActionRes>(`${server}/like`, JSON.stringify({
            song_id: song_id,
            action: !likedState,
            token: cookie.get("token")
        })).then(data => {
            const { success } = data;
            // const { action } = msg;
            if (!success) {
                if (likedState) {
                    like();
                } else {
                    unLike();
                }
            }
        })
    }


    return <button onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleClick()
    }}>
        <HeartIcon className={className ? className : ""} is_liked={likedSongs.has(song_id)}></HeartIcon>
    </button>
}