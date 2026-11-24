import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { UsernameSettings } from "../src/auth/UsernameSettings";
const fake=vi.hoisted(()=>({request:vi.fn()}));
vi.mock("../src/stores/service",()=>({request:fake.request}));
beforeEach(()=>{vi.resetAllMocks();fake.request.mockResolvedValue({username:null});});
it("permite que uma conta antiga escolha e normalize seu usuário",async()=>{
  const user=userEvent.setup();render(<UsernameSettings/>);
  await user.type(await screen.findByLabelText("Nome de usuário"),"ANA.Silva");
  fake.request.mockResolvedValueOnce({username:"ana.silva"});
  await user.click(screen.getByRole("button",{name:"Salvar nome de usuário"}));
  expect(await screen.findByRole("status")).toHaveTextContent("Nome de usuário salvo");
  expect(fake.request).toHaveBeenLastCalledWith("/api/me/username",{method:"PUT",body:'{"username":"ana.silva"}'});
});
it("mantém o formulário quando outro usuário já possui o nome",async()=>{
  fake.request.mockResolvedValueOnce({username:"old.name"});
  const user=userEvent.setup();render(<UsernameSettings/>);
  const input=await screen.findByLabelText("Nome de usuário");
  await user.clear(input);await user.type(input,"taken.name");
  fake.request.mockRejectedValueOnce(new Error("Este nome de usuário já está em uso."));
  await user.click(screen.getByRole("button",{name:"Salvar nome de usuário"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("já está em uso");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
