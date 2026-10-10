import { getOnline, request, setUnauthorizedHandler } from "../client";

const response = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body }) as Response;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setUnauthorizedHandler(null);
});

describe("request", () => {
  it("devuelve el JSON cuando el servidor responde bien", async () => {
    fetchMock.mockResolvedValue(response(200, { a: 1 }));
    await expect(request("/x")).resolves.toEqual({ a: 1 });
    expect(getOnline()).toBe(true);
  });

  it("reintenta las lecturas (GET) si falla la red", async () => {
    fetchMock.mockRejectedValueOnce(new Error("red")).mockResolvedValue(response(200, { ok: true }));
    await expect(request("/x")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lanza un error de red y marca sin conexión cuando todo falla", async () => {
    fetchMock.mockRejectedValue(new Error("red"));
    await expect(request("/x")).rejects.toMatchObject({ name: "NetworkError" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getOnline()).toBe(false);
  });

  it("no reintenta las escrituras (POST), para no duplicar acciones", async () => {
    fetchMock.mockRejectedValue(new Error("red"));
    await expect(request("/x", { method: "POST", body: {} })).rejects.toMatchObject({ name: "NetworkError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("avisa cuando la sesión ya no es válida (401 con token)", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(response(401, { error: "Token inválido o vencido" }));
    await expect(request("/x", { token: "abc" })).rejects.toThrow("Token inválido o vencido");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("no avisa un 401 sin token (un inicio de sesión fallido)", async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(response(401, { error: "Teléfono o contraseña incorrectos" }));
    await expect(request("/auth/login", { method: "POST", body: {} })).rejects.toThrow(
      "Teléfono o contraseña incorrectos"
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("muestra el mensaje de error que manda el servidor", async () => {
    fetchMock.mockResolvedValue(response(409, { error: "Ya tienes un viaje en curso" }));
    await expect(request("/viajes", { method: "POST", body: {}, token: "abc" })).rejects.toThrow(
      "Ya tienes un viaje en curso"
    );
  });
});