import { describePassengers } from "../labels";
import { distanceKm, formatDistance } from "../geo";
import { getInitials } from "../text";

describe("distanceKm", () => {
  it("mide un grado de longitud en el ecuador (~111 km)", () => {
    expect(distanceKm(0, 0, 0, 1)).toBeCloseTo(111.19, 1);
  });
  it("da cero para el mismo punto", () => {
    expect(distanceKm(8.89, -64.25, 8.89, -64.25)).toBe(0);
  });
});

describe("formatDistance", () => {
  it("usa metros por debajo de 1 km", () => {
    expect(formatDistance(0.45)).toBe("450 m");
  });
  it("usa kilómetros desde 1 km", () => {
    expect(formatDistance(2.34)).toBe("2.3 km");
  });
});

describe("describePassengers", () => {
  it("separa civiles y estudiantes", () => {
    expect(describePassengers(3, 1)).toBe("3 pasajeros · 2 civiles, 1 estudiante");
  });
  it("usa singular", () => {
    expect(describePassengers(1, 0)).toBe("1 pasajero · 1 civil");
  });
  it("solo estudiantes", () => {
    expect(describePassengers(2, 2)).toBe("2 pasajeros · 2 estudiantes");
  });
});

describe("getInitials", () => {
  it("toma las dos primeras iniciales", () => {
    expect(getInitials("Andres Oliveira")).toBe("AO");
  });
  it("funciona con una sola palabra", () => {
    expect(getInitials("zinia")).toBe("Z");
  });
  it("devuelve ? si el nombre está vacío", () => {
    expect(getInitials("")).toBe("?");
  });
});