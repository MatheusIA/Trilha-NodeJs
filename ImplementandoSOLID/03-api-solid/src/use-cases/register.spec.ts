// Describe serve para categorizar os testes.

import { beforeEach, describe, expect, it } from "vitest";
import { RegisterUseCase } from "./register";
import { compare } from "bcryptjs";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { UserAlreadyExistsError } from "./errors/user-already-exists";

let usersRepository: InMemoryUsersRepository;
let sut: RegisterUseCase;

describe("Register Use Case", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new RegisterUseCase(usersRepository);
  });

  it("should be able to register", async () => {
    const { user } = await sut.execute({
      name: " John Doe",
      email: "johndoe@example.com",
      password: "123456",
    });

    await expect(user.id).toEqual(expect.any(String));
  });

  it("should has user password upon registration", async () => {
    const { user } = await sut.execute({
      name: " John Doe",
      email: "johndoe@example.com",
      password: "123456",
    });

    const isPasswordCorrectlyHashed = await compare(
      "123456",
      user.password_hash,
    );

    await expect(isPasswordCorrectlyHashed).toBe(true);
  });

  it("should not be able to register with same email twice ", async () => {
    const email = "jonhdoe@example.com";

    await sut.execute({
      name: " John Doe",
      email,
      password: "123456",
    });

    // Sempre que for utilizar o expect, e ele retornar uma promisse, é preciso usar o awaits

    await expect(() =>
      sut.execute({
        name: " John Doe",
        email,
        password: "123456",
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });
});
