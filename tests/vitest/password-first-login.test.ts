import { describe, expect, it, vi } from "vitest";
import * as argon2 from "argon2";
import { AuthService } from "../../apps/api/src/auth/auth.service";

describe("Changement de mot de passe à la première connexion", () => {
  it("refuse un mot de passe faible et libère le compte après un changement valide", async () => {
    const passwordHash = await argon2.hash("Safir2026!DevCapacity");
    const user = {
      id: "user-1",
      passwordHash,
      mustChangePassword: true,
    };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
        update: vi.fn().mockResolvedValue(undefined),
      },
    };
    const service = new AuthService(prisma as never);

    await expect(
      service.changePassword(user.id, "Safir2026!DevCapacity", "faible123"),
    ).rejects.toThrow("majuscule");

    await service.changePassword(user.id, "Safir2026!DevCapacity", "Nouveau!2026");

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({ mustChangePassword: false }),
      }),
    );
    const updateCall = prisma.user.update.mock.calls[0][0];
    expect(await argon2.verify(updateCall.data.passwordHash, "Nouveau!2026")).toBe(true);
  }, 30000);
});
