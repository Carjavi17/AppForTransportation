import "./setup";
import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { prisma } from "../src/db";
import { app, authHeader, createDriver, createUser, resetDb } from "./helpers";

describe("usuarios", () => {
  beforeEach(resetDb);
  after(() => prisma.$disconnect());

  it("el registro siempre crea un pasajero, aunque pidan otro rol", async () => {
    const res = await request(app)
      .post("/auth/registro")
      .send({ nombre: "Ana", telefono: "0411000001", password: "secreto1", rol: "ADMINISTRADOR" });
    assert.equal(res.status, 201);
    assert.equal(res.body.usuario.rol, "USUARIO");
  });

  it("un pasajero no puede usar las rutas del administrador", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const res = await request(app).get("/admin/usuarios").set(authHeader(passenger));
    assert.equal(res.status, 403);
  });

  it("al desactivar a un usuario su sesión deja de valer", async () => {
    const admin = await createUser("ADMINISTRADOR", "0400000009");
    const passenger = await createUser("USUARIO", "0400000001");

    const res = await request(app)
      .patch(`/admin/usuarios/${passenger.id}/activo`)
      .set(authHeader(admin))
      .send({ activo: false });
    assert.equal(res.status, 200);

    const me = await request(app).get("/auth/yo").set(authHeader(passenger));
    assert.equal(me.status, 401);
  });

  it("el inicio de sesión rechaza una cuenta desactivada", async () => {
    await createUser("USUARIO", "0400000001", { password: "secreto1", active: false });
    const res = await request(app).post("/auth/login").send({ telefono: "0400000001", password: "secreto1" });
    assert.equal(res.status, 403);
  });

  it("un administrador no puede desactivar su propia cuenta", async () => {
    const admin = await createUser("ADMINISTRADOR", "0400000009");
    const res = await request(app)
      .patch(`/admin/usuarios/${admin.id}/activo`)
      .set(authHeader(admin))
      .send({ activo: false });
    assert.equal(res.status, 400);
  });

  it("no desactiva a un conductor con pasajeros asignados", async () => {
    const admin = await createUser("ADMINISTRADOR", "0400000009");
    const passenger = await createUser("USUARIO", "0400000001");
    const { user: driver, driverId } = await createDriver("0400000002", "AAA111");
    await prisma.viaje.create({
      data: {
        usuarioId: passenger.id,
        conductorId: driverId,
        estado: "ASIGNADO",
        latitudOrigen: 8.89,
        longitudOrigen: -64.25,
        pasajeros: 1,
        tipoPago: "EFECTIVO",
      },
    });

    const res = await request(app)
      .patch(`/admin/usuarios/${driver.id}/activo`)
      .set(authHeader(admin))
      .send({ activo: false });
    assert.equal(res.status, 409);
  });
});