import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/es.json";
import { type PublicAnimal, ShelterPublicProfile } from "./ShelterPublicProfile";

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const animales: PublicAnimal[] = [
  { id: "a1", name: "Luna", slug: "luna", status: "available", animal_media: [] },
];

describe("ShelterPublicProfile", () => {
  it("muestra nombre, ubicación, descripción, horario y colaboración", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{
          name: "Refugio Esperanza",
          city: "Bilbao",
          province: "Bizkaia",
          description: "Somos un refugio de prueba.",
          opening_hours: { lun: [{ open: "10:00", close: "14:00" }] },
          accepts_volunteers: true,
          status: "verified",
        }}
        animals={animales}
      />,
    );
    expect(screen.getByRole("heading", { name: "Refugio Esperanza" })).toBeInTheDocument();
    expect(screen.getByText(/Bilbao, Bizkaia/)).toBeInTheDocument();
    expect(screen.getByText("Somos un refugio de prueba.")).toBeInTheDocument();
    expect(screen.getByText("10:00–14:00")).toBeInTheDocument();
    expect(screen.getByText(messages.shelterPublic.volunteers)).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
  });

  it("sin animales muestra el mensaje vacío", () => {
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.getByText(messages.shelterPublic.noAnimals)).toBeInTheDocument();
  });
});
