import React, { SetStateAction, useRef, useState } from "react"
import { Post, server } from "../App";
import { Content } from "./Layout";
import { CurrentSongCtx, currentSongInit, likedCtx, qCtx, queue, setCurentSongCtx, setLikedCtx, setQCtx } from "../components/GlobalContext";
// import { serverRes } from "./login";
import cookie from "js-cookie";
import { v4 } from "uuid";
import LikeButton from "../components/LikeButton";
import AddButton from "../components/AddToPlButton";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import Spinner from "../components/Spinner";
type searchResultItem = {
    id: string,
    title: string,
    channel: string,
    channel_id: string,
    video_id: string,
    thumbnail_url: string,
    is_liked: boolean,
    duration_ms: number,
};
type searchResultRes = {
    success: boolean,
    msg: string,
    items: searchResultItem[]
};


export type PlayRes = {
    success: boolean,
    msg: {
        url: string,
        next_id: string,
    }
}

export default function Search() {
    const [searchResults, setSearchResults] = useState<searchResultItem[]>([])
    const [searchLoading, setSearchLoading] = useState(false);
    const [playloading, setPlayloading] = useState(false);
    return <Content>
        {
            <div className="grid grid-rows-[8vh_auto] gap-4 w-full h-full">
                <div className="border-b-white border-b">
                    <SearchBar setSearchResults={setSearchResults} setSearchLoading={setSearchLoading}></SearchBar>
                </div>
                <div className="flex flex-col gap-8 items-center mb-4 h-full w-full">
                    {
                        searchLoading ? <div className="h-full w-full flex justify-center items-center">
                            <Spinner className="h-40 w-40"></Spinner>
                        </div> : searchResults.map((s) => {
                            return <ResultCard key={v4()} item={s} playLoading={playloading} setPlayLoading={setPlayloading}></ResultCard>
                        })}
                </div>
            </div>
        }

    </Content>
}

export type set<T> = React.Dispatch<SetStateAction<T>>;


type SearchBarProps = {
    setSearchResults: set<searchResultItem[]>
    setSearchLoading: set<boolean>
};

function SearchBar(props: SearchBarProps) {
    const { setSearchResults, setSearchLoading } = props;
    const barRef = useRef<HTMLInputElement>(null);
    const likedSongs = likedCtx()
    const setLikedSongs = setLikedCtx()
    const onSubmit = () => {
        if (barRef && barRef.current) {
            const t = barRef.current.value;

            if (t) {

                //TODO make this POST
                setSearchLoading(true)
                fetch(`${server}/search?title=${t}&token=${cookie.get("token")}`).then(res => res.json()).then((d: searchResultRes) => {
                    if (d.success) {
                        setSearchResults(d.items);
                        const tempSet = new Set(likedSongs);
                        d.items.forEach(i => {
                            if (i.is_liked) {
                                tempSet.add(i.id)
                                // console.log("adding ", i.id);
                            } else {
                                tempSet.delete(i.id)
                                // console.log("deleteing ", i.id);
                            }
                        })
                        // console.log("set = ", tempSet);
                        setSearchLoading(false);
                        setLikedSongs(tempSet)
                    } else {
                        alert(d.msg);
                    }
                })

            }
        }
    }
    return <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
    }} className="ml-8 h-full flex items-center text-black font-bold">
        <label htmlFor="searchBar">
            <div className="flex items-center justify-center text-black h-12 w-10 rounded-l-full bg-white">
                <MagnifyingGlassIcon className="h-6 w-6"></MagnifyingGlassIcon>
            </div>
        </label>
        <input id="searchBar" ref={barRef} autoFocus={true} className="bg-white h-12 w-96 rounded-r-full focus:outline-none pr-10">
        </input>

    </form>
}

function ResultCard(props: {
    item: searchResultItem
    playLoading: boolean
    setPlayLoading: set<boolean>
}) {
    const { item, playLoading, setPlayLoading } = props;
    const { channel, thumbnail_url, title, video_id, duration_ms, id, is_liked } = item;
    const currentSong = CurrentSongCtx()
    const setCurrentSong = setCurentSongCtx()
    const likedSongs = likedCtx();
    const q = qCtx();
    const setQ = setQCtx();
    return <div onClick={() => {
        if (!playLoading) {
            setPlayLoading(true);
            setQ({
                index: 0,
                songs: []
            })
            setCurrentSong(currentSongInit);
            fetch(`${server}/play?id=${item.video_id}`).then(res => res.json()).then((data: PlayRes) => {
                setPlayLoading(false);
                const { msg, success } = data;
                console.log(data)
                if (success && msg) {
                    setCurrentSong({
                        ...currentSong,
                        currentSong: {
                            song: {
                                id,
                                artist: channel,
                                durationms: duration_ms,
                                video_id: video_id,
                                isLiked: false,
                                src: msg.url,
                                thumbnail: thumbnail_url,
                                title: title,
                                is_liked
                            },
                            isPlaying: true,
                            passed: 0
                        }
                    })
                    generateQueue(msg.next_id, 10, q, setQ)
                    // .then(q => {
                    //     // console.log(i);
                    //     setQ({ songs: q, index: 0 })
                    // });
                }
            })
        }
    }} className=" w-[48rem] h-64 grid grid-cols-[40%_auto] bg-slate-600 rounded-md px-4 py-2 gap-2 items-center cursor-pointer">
        <div className="flex items-center">
            <img src={item.thumbnail_url} alt={`${item.title} thumbnail`} className="rounded-md h-fit"></img>
        </div>
        <div className="flex flex-col gap-4">
            <p className="text-xl font-bold">
                {item.title}
            </p>
            <p className="text-lg">
                {item.channel}
            </p>
            <div className="flex flex-row gap-2">
                <LikeButton is_liked={likedSongs.has(id)} song_id={id} ></LikeButton>
                <AddButton song={{
                    artist: item.channel,
                    durationms: item.duration_ms,
                    id: item.id,
                    thumbnail: item.thumbnail_url,
                    title: item.title,
                    video_id: item.video_id
                }}></AddButton>
            </div>
        </div>
    </div>
}



export type SongInfo = {
    id: string,
    title: string,
    channel: string,
    channel_id: string,
    video_id: string,
    thumbnail_url: string,
    duration_ms: number,
    is_liked: boolean,
    url: string,
}


export type GetInfoRes = {
    success: boolean,
    msg: {
        info: {
            id: string,
            title: string,
            channel: string,
            channel_id: string,
            video_id: string,
            thumbnail_url: string,
            duration_ms: number,
            is_liked: boolean,
        },
        next_id: string
        url: string
    }
}


export async function generateQueue(song_id: string, limit: number, q: queue, setQ: (newState: queue) => void) {
    // let retArr: SongInfo[] = [];
    let next_id = song_id;
    for (let _ = 0; _ < limit; _++) {
        const data = await Post<GetInfoRes>(`${server}/get_song_info`, JSON.stringify({
            token: cookie.get("token"),
            song_id: next_id
        }))
        if (data.success) {
            const { channel, channel_id, duration_ms, id, is_liked, thumbnail_url, title, video_id } = data.msg.info;
            let temp: SongInfo = {
                channel,
                channel_id,
                duration_ms,
                id,
                is_liked,
                thumbnail_url,
                title,
                url: data.msg.url,
                video_id
            }

            const tempq = { ...q }
            tempq.songs.push(temp)
            setQ(tempq)
            // retArr.push(temp);
            // console.log(temp);
        }
        next_id = data.msg.next_id;
    }
    // return retArr
}