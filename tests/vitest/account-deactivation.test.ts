import { describe, expect, it, vi } from "vitest";
import { DevelopersController } from "../../apps/api/src/developers/developers.controller";
import { ConsultantsController } from "../../apps/api/src/consultants/consultants.controller";

describe("Désactivation des comptes développeur et consultant", () => {
  it("désactive un développeur via l'endpoint dédié", async () => {
    const service = {
      deactivateDeveloper: vi.fn().mockResolvedValue({ id: "dev-1", deleted: true }),
    };
    const controller = new DevelopersController(service as never);

    await expect(controller.deleteDeveloper("dev-1")).resolves.toEqual({
      id: "dev-1",
      deleted: true,
    });
    expect(service.deactivateDeveloper).toHaveBeenCalledWith("dev-1");
  });

  it("désactive un consultant via l'endpoint dédié", async () => {
    const service = {
      deactivate: vi.fn().mockResolvedValue({ id: "consultant-1", deleted: true }),
    };
    const controller = new ConsultantsController(service as never);

    await expect(controller.deleteConsultant("consultant-1")).resolves.toEqual({
      id: "consultant-1",
      deleted: true,
    });
    expect(service.deactivate).toHaveBeenCalledWith("consultant-1");
  });
});
