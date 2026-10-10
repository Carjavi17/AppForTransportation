import "./setup";
import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { prisma } from "../src//db";
import { app, authHeader, createDriver, createUser, resetDb, validTrip } from "./helpers";

describe("viajes", () => {
  beforeEach(resetDb);
  after(() => prisma.$disconnect());

    it("cancelar y empezar el viaje a la vez: solo uno gana", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const dispatcher = await createUser("CONTROLADOR", "0400000003");
    const { user: driver, driverId } = await createDriver("0400000002", "AAA111");
    const trip = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);
    await request(app)
      .patch(`/viajes/${trip.body.id}/asignar`)
      .set(authHeader(dispatcher))
      .send({ conductorId: driverId });

    const [cancel, start] = await Promise.all([
      request(app).patch(`/viajes/${trip.body.id}/cancelar`).set(authHeader(passenger)),
      request(app).patch(`/viajes/${trip.body.id}/estado`).set(authHeader(driver)).send({ estado: "EN_CURSO" }),
    ]);
    const winners = [cancel.status, start.status].filter((status) => status === 200);
    assert.equal(winners.length, 1);
  });

  it("un pasajero pide un viaje con civiles y estudiantes", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const res = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);
    assert.equal(res.status, 201);
    assert.equal(res.body.estado, "SOLICITADO");
    assert.equal(res.body.pasajeros, 2);
    assert.equal(res.body.estudiantes, 1);
  });

  it("el pago móvil se puede pedir sin referencia", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const res = await request(app)
      .post("/viajes")
      .set(authHeader(passenger))
      .send({ ...validTrip, tipoPago: "PAGO_MOVIL" });
    assert.equal(res.status, 201);
    assert.equal(res.body.referenciaPago, null);
  });

  it("rechaza más estudiantes que pasajeros", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const res = await request(app)
      .post("/viajes")
      .set(authHeader(passenger))
      .send({ ...validTrip, pasajeros: 1, estudiantes: 2 });
    assert.equal(res.status, 400);
  });

  it("un conductor no puede pedir viajes", async () => {
    const { user } = await createDriver("0400000002", "AAA111");
    const res = await request(app).post("/viajes").set(authHeader(user)).send(validTrip);
    assert.equal(res.status, 403);
  });

  it("rechaza un segundo viaje mientras hay uno activo", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);
    const second = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);
    assert.equal(second.status, 409);
  });

  it("pedidos simultáneos del mismo pasajero crean un solo viaje", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(app).post("/viajes").set(authHeader(passenger)).send(validTrip))
    );
    const created = responses.filter((res) => res.status === 201);
    assert.equal(created.length, 1);
    assert.equal(await prisma.viaje.count(), 1);
  });

  it("el controlador asigna un viaje a un conductor conectado", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const dispatcher = await createUser("CONTROLADOR", "0400000003");
    const { driverId } = await createDriver("0400000002", "AAA111");
    const trip = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);

    const res = await request(app)
      .patch(`/viajes/${trip.body.id}/asignar`)
      .set(authHeader(dispatcher))
      .send({ conductorId: driverId });
    assert.equal(res.status, 200);
    assert.equal(res.body.estado, "ASIGNADO");
    assert.equal(res.body.conductorId, driverId);
  });

  it("no asigna a un conductor desconectado", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const dispatcher = await createUser("CONTROLADOR", "0400000003");
    const { driverId } = await createDriver("0400000002", "AAA111", false);
    const trip = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);

    const res = await request(app)
      .patch(`/viajes/${trip.body.id}/asignar`)
      .set(authHeader(dispatcher))
      .send({ conductorId: driverId });
    assert.equal(res.status, 400);
  });

  it("reasigna un viaje a otro conductor", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const dispatcher = await createUser("CONTROLADOR", "0400000003");
    const first = await createDriver("0400000002", "AAA111");
    const second = await createDriver("0400000004", "BBB222");
    const trip = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);
    const url = `/viajes/${trip.body.id}/asignar`;

    await request(app).patch(url).set(authHeader(dispatcher)).send({ conductorId: first.driverId });
    const res = await request(app).patch(url).set(authHeader(dispatcher)).send({ conductorId: second.driverId });
    assert.equal(res.status, 200);
    assert.equal(res.body.conductorId, second.driverId);

    const again = await request(app).patch(url).set(authHeader(dispatcher)).send({ conductorId: second.driverId });
    assert.equal(again.status, 409);
  });

  it("devuelve un viaje asignado a la lista de solicitudes", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const dispatcher = await createUser("CONTROLADOR", "0400000003");
    const { driverId } = await createDriver("0400000002", "AAA111");
    const trip = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);
    await request(app)
      .patch(`/viajes/${trip.body.id}/asignar`)
      .set(authHeader(dispatcher))
      .send({ conductorId: driverId });

    const res = await request(app).patch(`/viajes/${trip.body.id}/desasignar`).set(authHeader(dispatcher));
    assert.equal(res.status, 200);
    assert.equal(res.body.estado, "SOLICITADO");
    assert.equal(res.body.conductorId, null);
  });

  it("un pasajero no puede cancelar el viaje de otro", async () => {
    const owner = await createUser("USUARIO", "0400000001");
    const other = await createUser("USUARIO", "0400000005");
    const trip = await request(app).post("/viajes").set(authHeader(owner)).send(validTrip);
    const res = await request(app).patch(`/viajes/${trip.body.id}/cancelar`).set(authHeader(other));
    assert.equal(res.status, 404);
  });

  it("no asigna un viaje cancelado", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const dispatcher = await createUser("CONTROLADOR", "0400000003");
    const { driverId } = await createDriver("0400000002", "AAA111");
    const trip = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);
    await request(app).patch(`/viajes/${trip.body.id}/cancelar`).set(authHeader(passenger));

    const res = await request(app)
      .patch(`/viajes/${trip.body.id}/asignar`)
      .set(authHeader(dispatcher))
      .send({ conductorId: driverId });
    assert.equal(res.status, 409);
  });

  it("el pasajero envía la referencia del pago móvil durante el viaje", async () => {
    const passenger = await createUser("USUARIO", "0400000001");
    const trip = await request(app).post("/viajes").set(authHeader(passenger)).send(validTrip);

    const res = await request(app)
      .patch(`/viajes/${trip.body.id}/pago`)
      .set(authHeader(passenger))
      .send({ referenciaPago: "123456" });
    assert.equal(res.status, 200);
    assert.equal(res.body.tipoPago, "PAGO_MOVIL");
    assert.equal(res.body.referenciaPago, "123456");

    const empty = await request(app)
      .patch(`/viajes/${trip.body.id}/pago`)
      .set(authHeader(passenger))
      .send({ referenciaPago: "  " });
    assert.equal(empty.status, 400);
  });
});