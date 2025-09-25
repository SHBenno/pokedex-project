"use client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ReactElement, Fragment, useState } from "react"

import { StarIcon as StarSolid } from "@heroicons/react/20/solid";
import { StarIcon as StarOutlined} from "@heroicons/react/24/outline";
import { authClient } from "../lib/auth-client";
import {User} from "better-auth";

interface type {
  name: string,
  url: string
}

interface typeData {
  slot: number
  type: type
}

interface u extends User {
  favourites: string,
}

interface favouriteMutationData {
  pokemonId: number
}

function PokemonCard({ name, url, id }: {name: string, url: string, id: number}) {
  const { data, error, isPending } = useQuery({
    queryKey: ["pokemon", id],
    queryFn: async()=> {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id+1}`)
      return res.json();      
    }
  })

  const queryClient = useQueryClient();

  const session = useQuery({
    queryKey: ["getSession"],
    queryFn: async()=>{
      return authClient.getSession();
    },
    staleTime: 60*1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const favouriteMutation = useMutation({
    mutationFn: async (mutationData: favouriteMutationData) => {
      let favourites: number[] = JSON.parse((session.data?.data?.user as u).favourites);

      if (favourite) {
        favourites.push(mutationData.pokemonId);
      } else {
        favourites = favourites.filter(id => id !== mutationData.pokemonId);
      }

      await authClient.updateUser({
        favourites: JSON.stringify(favourites),
      } as any);

      await queryClient.invalidateQueries({ queryKey: ["getSession"] });
      return favourites;
    },
  });


  const loggedin = (session.data?.data);

  const [favourite, setFavourite] = useState(false);
  
  if (session.isPending) {
    return "Loading...";
  }
  
  if (loggedin && session.data?.data && (JSON.parse((session.data?.data.user as u).favourites) as Array<Number>).includes(id+1)){
    if (!favourite) setFavourite(true);
  }

  const toggleFavourite = () => {
    if (!loggedin) return;

    setFavourite(!favourite);
    favouriteMutation.mutate({ pokemonId: id+1 });
  }
  const pokemonId = id+1;
  
  return (
    <div className="
    w-full 
    h-20 
    hover:scale-102
    snap-normal
    rounded-md 
    outline 
    outline-sky-500 
    bg-blue-500/50">
      <div className="flex gap-3 p-2 relative">
        <img alt="idfk" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id+1}.png`} className="w-16 h-16 bg-sky-500/40 rounded-sm outline outline-sky-500/80"/>
        <div className="flex flex-col">
          <h1 className="font-bold">{name}</h1>
          <div className="flex w-full">
            { isPending ? (
              <h1 className="text-sm">Loading...</h1>
            ) : error ? (
              <h1 className="text-sm">Couldn't grab details...</h1>
            ) : data && (
              <div>
                <h1 className="text-sm">⚖️ Weight: {data.weight/10}kg</h1>
                <span className="text-sm flex gap-1">🧬 Type: {data.types.map((s: typeData) => <Fragment key={s.type.name+"-"+pokemonId}> <h1>
                  {s.type.name == "bug" && "🐛"}
                  {s.type.name == "dark" && "🌑"}
                  {s.type.name == "dragon" && "🐉"}
                  {s.type.name == "electric" && "⚡"}
                  {s.type.name == "fairy" && "🧚"}
                  {s.type.name == "fighting" && "🥊"}
                  {s.type.name == "fire" && "🔥"}
                  {s.type.name == "flying" && "🕊️"}
                  {s.type.name == "ghost" && "👻"}
                  {s.type.name == "grass" && "🌱"}
                  {s.type.name == "ground" && "🌍"}
                  {s.type.name == "ice" && "❄️"}
                  {s.type.name == "normal" && "🐄"}
                  {s.type.name == "poison" && "☠️"}
                  {s.type.name == "psychic" && "🧠"}
                  {s.type.name == "rock" && "🪨"}
                  {s.type.name == "steel" && "⚙️"}
                  {s.type.name == "water" && "💧"}

                  {s.type.name}
                  </h1></Fragment>)}</span>
              </div>
            )}
          </div>
          { favourite ? (
            <StarSolid className="absolute m-2 top-0 right-0 size-5 hover:scale-105 fill-yellow-500 hover:fill-yellow-600" onClick={toggleFavourite}/>
          ) : 
            <StarOutlined className="absolute m-2 top-0 right-0 size-5 hover:scale-105 hover:fill-yellow-600/50" onClick={toggleFavourite}/>
          }
        </div>
      </div>
    </div>
  )
}

interface pageResponse extends ReactElement {
  next: string
}

export default function PokemonPage(): ReactElement {
  const fetchPokemon = async ({ pageParam }: { pageParam: string }) => {
    const res = await fetch(pageParam)
    return res.json();
  }
  
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["pokedex"],
    queryFn: fetchPokemon,
    initialPageParam: "https://pokeapi.co/api/v2/pokemon/",
    getNextPageParam: (lastPage, pages) => (lastPage as pageResponse).next
  })

  const session = useQuery({
    queryKey: ["getSession"],
    queryFn: async()=>{
      return authClient.getSession();
    },
    staleTime: 60*1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return status === 'pending' ? (
    <p>Loading...</p>
  ) : status === 'error' ? (
    <p>Error: {error.message}</p>
  ) : (
    <div className="flex justify-center items-center bg-slate-900 w-screen h-screen">
      <div className="flex md:flex-col justify-center items-center w-full h-full">
        <div className={`
        relative
        flex
        flex-col
        gap-2
        h-160 
        w-80 
        overflow-auto
        snap-x
        rounded-lg 
        p-5 
        bg-blue-900/90
        ${ isFetching || isFetchingNextPage ? "inset-shadow-sm inset-shadow-gray-900" : "inset-shadow-sm inset-shadow-gray-900"} 
        outline 
        outline-sky-500`}
        
        onScroll={(event)=>{ 
          const target = event.currentTarget; 
          if ((target.scrollTop + target.clientHeight >= target.scrollHeight -3) && (!isFetching && !isFetchingNextPage)) {
            fetchNextPage();
          }
        }}>
          {data.pages.map((group, i) => (
            <Fragment key={i}>
              {group.results.map((pokemon: { name: string, url: string }, j:number) => (
                <Fragment key={j}>
                  <PokemonCard name={pokemon.name} url={pokemon.url} id={j+(i*20)}/>
                </Fragment>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}