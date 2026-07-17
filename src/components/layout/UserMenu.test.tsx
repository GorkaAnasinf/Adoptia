import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { UserMenu } from "./UserMenu";

const getUserMock = vi.fn();
const signOutMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: signOutMock,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock }),
}));

function renderMenu(role?: "adopter" | "shelter" | "admin" | null) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <UserMenu role={role} />
    </NextIntlClientProvider>,
  );
}

async function abrirMenu() {
  const avatar = await screen.findByRole("button", { name: messages.shell.userMenu });
  await userEvent.click(avatar);
}

describe("UserMenu", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    signOutMock.mockReset();
    refreshMock.mockReset();
  });

  it("muestra el enlace de login sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    renderMenu();
    expect(
      await screen.findByRole("link", { name: messages.nav.login }),
    ).toHaveAttribute("href", "/login");
  });

  it("con sesión muestra un avatar que abre el menú y permite salir", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "ana@example.com" } },
      error: null,
    });
    signOutMock.mockResolvedValue({ error: null });
    renderMenu();

    const avatar = await screen.findByRole("button", { name: messages.shell.userMenu });
    await userEvent.click(avatar);

    // El menú muestra el email y la opción de salir
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: messages.auth.logout }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("con avatar_url muestra la foto de perfil; sin él, iniciales", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "ana@example.com",
          user_metadata: { avatar_url: "https://lh3.googleusercontent.com/a/foto" },
        },
      },
      error: null,
    });
    renderMenu();
    const img = await screen.findByAltText(messages.shell.userAvatar);
    expect(img).toBeInTheDocument();
  });

  it("sin avatar_url cae a las iniciales del email", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "ana@example.com" } },
      error: null,
    });
    renderMenu();
    expect(await screen.findByText("AN")).toBeInTheDocument();
    expect(screen.queryByAltText(messages.shell.userAvatar)).not.toBeInTheDocument();
  });

  it("si la foto falla al cargar, cae a las iniciales", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "ana@example.com",
          user_metadata: { avatar_url: "https://lh3.googleusercontent.com/a/rota" },
        },
      },
      error: null,
    });
    renderMenu();
    const img = await screen.findByAltText(messages.shell.userAvatar);
    fireEvent.error(img);
    expect(await screen.findByText("AN")).toBeInTheDocument();
    expect(screen.queryByAltText(messages.shell.userAvatar)).not.toBeInTheDocument();
  });

  it("muestra el nombre completo en el menú cuando existe full_name", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "ana@example.com",
          user_metadata: { full_name: "Ana Pérez" },
        },
      },
      error: null,
    });
    renderMenu();
    const avatar = await screen.findByRole("button", { name: messages.shell.userMenu });
    await userEvent.click(avatar);
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("el menú está cerrado hasta que se pulsa el avatar", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "ana@example.com" } },
      error: null,
    });
    renderMenu();
    await screen.findByRole("button", { name: messages.shell.userMenu });
    expect(screen.queryByText("ana@example.com")).not.toBeInTheDocument();
  });

  it("protectora: el menú incluye acceso al panel de protectora", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "prot@example.com" } },
      error: null,
    });
    renderMenu("shelter");
    await abrirMenu();

    expect(screen.getByRole("menuitem", { name: messages.shell.navShelterPanel })).toHaveAttribute(
      "href",
      "/panel",
    );
    // No mezcla accesos de adoptante
    expect(
      screen.queryByRole("menuitem", { name: messages.shell.navFavorites }),
    ).not.toBeInTheDocument();
  });

  it("adoptante: el menú incluye favoritos, solicitudes y citas, sin panel de protectora", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "ana@example.com" } },
      error: null,
    });
    renderMenu("adopter");
    await abrirMenu();

    expect(screen.getByRole("menuitem", { name: messages.shell.navFavorites })).toHaveAttribute(
      "href",
      "/mi-cuenta/favoritos",
    );
    expect(screen.getByRole("menuitem", { name: messages.shell.navMyRequests })).toHaveAttribute(
      "href",
      "/mi-cuenta/solicitudes",
    );
    expect(
      screen.getByRole("menuitem", { name: messages.shell.navMyAppointments }),
    ).toHaveAttribute("href", "/mi-cuenta/citas");
    expect(screen.getByRole("menuitem", { name: messages.shell.navFosterCare })).toHaveAttribute(
      "href",
      "/mi-cuenta/acogida",
    );
    expect(
      screen.queryByRole("menuitem", { name: messages.shell.navShelterPanel }),
    ).not.toBeInTheDocument();
  });

  it("admin: el menú incluye acceso al panel de administración", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@example.com" } },
      error: null,
    });
    renderMenu("admin");
    await abrirMenu();

    expect(screen.getByRole("menuitem", { name: messages.shell.navAdminPanel })).toHaveAttribute(
      "href",
      "/admin/protectoras",
    );
  });
});
