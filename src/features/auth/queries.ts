import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { fetchMe, login, logout, register } from "./api";
import { clearToken, getToken, setToken } from "./token";
import type { LoginInput, RegisterInput, User } from "./types";

export const sessionKeys = {
  all: ["session"] as const,
};

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionKeys.all,
    queryFn: ({ signal }) => fetchMe(signal),
    // Sem crachá salvo, nem vale a pena perguntar pro servidor quem está logado.
    enabled: !!getToken(),
    retry: false,
  });
}

export function useSession() {
  return useQuery(sessionQueryOptions());
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: ({ user, token }) => {
      setToken(token);
      queryClient.setQueryData<User>(sessionKeys.all, user);
      // A identidade mudou: tudo que o cache guardava (favoritos, carrinho...)
      // pode ser de outra pessoa. Mais simples e seguro jogar tudo fora e
      // deixar cada tela buscar de novo, já com o crachá novo.
      void queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: ({ user, token }) => {
      setToken(token);
      queryClient.setQueryData<User>(sessionKeys.all, user);
      void queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      clearToken();
      queryClient.setQueryData(sessionKeys.all, null);
      void queryClient.invalidateQueries();
    },
  });
}
