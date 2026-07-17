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

describe("ShelterPublicProfile — hero (FEATURE-028)", () => {
  it("muestra la foto de portada cuando existe", () => {
    conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", cover_url: "https://cdn/cover.webp" }}
        animals={[]}
      />,
    );
    const img = screen.getByAltText(/portada de refugio/i);
    expect(img).toBeInTheDocument();
  });

  it("sin portada no hay imagen de portada (degradado de marca)", () => {
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.queryByAltText(/portada/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Refugio" })).toBeInTheDocument();
  });

  it("el badge de verificada solo aparece con status verified", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile shelter={{ name: "Refugio", status: "verified" }} animals={[]} />,
    );
    expect(screen.getByText(messages.shelterPublic.verified)).toBeInTheDocument();
    unmount();
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio", status: "pending" }} animals={[]} />);
    expect(screen.queryByText(messages.shelterPublic.verified)).not.toBeInTheDocument();
  });

  it("Contactar es un mailto al email de la protectora; sin email no aparece", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", email: "hola@refugio.org" }}
        animals={[]}
      />,
    );
    const enlace = screen.getByRole("link", { name: messages.shelterPublic.contactCta });
    expect(enlace).toHaveAttribute("href", "mailto:hola@refugio.org");
    unmount();
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(
      screen.queryByRole("link", { name: messages.shelterPublic.contactCta }),
    ).not.toBeInTheDocument();
  });

  it("Donar solo aparece con enlace de donaciones", () => {
    const { unmount } = conIntl(
      <ShelterPublicProfile
        shelter={{ name: "Refugio", donation_link: "https://www.teaming.net/x" }}
        animals={[]}
      />,
    );
    expect(screen.getAllByText(messages.shelterPublic.donarCta).length).toBeGreaterThan(0);
    unmount();
    conIntl(<ShelterPublicProfile shelter={{ name: "Refugio" }} animals={[]} />);
    expect(screen.queryByText(messages.shelterPublic.donarCta)).not.toBeInTheDocument();
  });
});
