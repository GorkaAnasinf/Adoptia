import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns?: string) => {
    const { createTranslator } = await import("next-intl");
    return createTranslator({ locale: "es", messages, namespace: ns as never });
  }),
  getFormatter: vi.fn(async () => {
    const { createFormatter } = await import("next-intl");
    return createFormatter({ locale: "es" });
  }),
}));

import { listarGuias } from "@/lib/guias";
import GuiasPage from "./page";
import GuiaPage, { generateMetadata } from "./[slug]/page";

async function renderIndice() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {await GuiasPage()}
    </NextIntlClientProvider>,
  );
}

describe("Índice de guías", () => {
  it("lista las guías reales agrupadas con enlace y tiempo de lectura", async () => {
    await renderIndice();
    const guias = listarGuias();
    for (const g of guias) {
      expect(screen.getByRole("link", { name: new RegExp(g.titulo.slice(0, 20)) })).toHaveAttribute(
        "href",
        `/guias/${g.slug}`,
      );
    }
    expect(screen.getAllByText(/min de lectura/).length).toBeGreaterThanOrEqual(4);
  });
});

describe("Artículo de guía", () => {
  const slug = () => listarGuias()[0].slug;

  it("renderiza la guía con TOC, JSON-LD Article y CTA", async () => {
    const { container } = render(
      <NextIntlClientProvider locale="es" messages={messages}>
        {await GuiaPage({ params: Promise.resolve({ slug: slug() }) })}
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.guias.tocTitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.guias.ctaBoton })).toHaveAttribute(
      "href",
      "/animales",
    );
    const jsonLd = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(jsonLd!.textContent!)["@type"]).toBe("Article");
  });

  it("generateMetadata usa el título/descel de la guía; slug inexistente → notFound", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: slug() }) });
    expect(meta.title).toBe(listarGuias()[0].titulo);

    await expect(
      GuiaPage({ params: Promise.resolve({ slug: "no-existe" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
