import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@caddy-manager/ui";
import type { SiteInventory } from "@caddy-manager/shared-types";
import { api } from "../api/client";

export default function SiteInventory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const inventoryView =
    searchParams.get("view") === "caddyfile" ? "caddyfile" : "dynamic";
  const ensureMutation = useMutation({
    mutationFn: () => api.ensureDynamicInfrastructure(),
    onSuccess: (result) =>
      setFeedback(
        `Dynamic infrastructure is ready for ${result.serverBlocks} Caddy server block${result.serverBlocks === 1 ? "" : "s"}.`,
      ),
    onError: (error) =>
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to ensure dynamic infrastructure",
      ),
  });
  const query = useQuery({
    queryKey: ["site-inventory"],
    queryFn: () => api.getSiteInventory(),
    refetchInterval: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "ready" | "provision" | "disable";
    }) => {
      if (action === "ready") return api.markInventoryReady(id);
      if (action === "provision") return api.provisionInventory(id);
      return api.disableInventory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (error) =>
      setFeedback(
        error instanceof Error ? error.message : "Inventory action failed",
      ),
  });

  const rows = (query.data ?? []).filter(
    (row) =>
      row.managementType ===
      (inventoryView === "caddyfile" ? "caddyfile" : "dynamic"),
  );

  const changeInventoryView = (view: "dynamic" | "caddyfile") => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", view);
    setSearchParams(nextParams);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Desired state"
        title={
          inventoryView === "dynamic"
            ? "Dynamic site inventory"
            : "Caddyfile-managed inventory"
        }
        description={
          inventoryView === "dynamic"
            ? "Desired-state definitions provisioned through the Caddy Admin API."
            : "Definitions discovered from Caddyfile configuration and kept read-only."
        }
        actions={
          <div className="d-flex gap-2 align-items-center">
            <button
              className="btn btn-outline-success"
              onClick={() => ensureMutation.mutate()}
              disabled={ensureMutation.isPending}
              title="Create dynamic-sites and dynamic-site-router when missing"
            >
              <i className="bi bi-shield-check me-1"></i>
              {ensureMutation.isPending ? "Ensuring..." : "Ensure Caddy setup"}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/sites/new")}
            >
              <i className="bi bi-plus-lg me-1"></i>Add site
            </button>
          </div>
        }
        signal={
          <>
            <strong>{rows.length} definitions</strong>
            <span className="ms-auto">
              {rows.filter((row) => row.state === "provisioned").length}{" "}
              provisioned
            </span>
          </>
        }
      />

      <nav className="site-view-tabs mb-3" aria-label="Inventory views">
        <button
          type="button"
          className={inventoryView === "dynamic" ? "active" : ""}
          onClick={() => changeInventoryView("dynamic")}
          aria-current={inventoryView === "dynamic" ? "page" : undefined}
        >
          <i className="bi bi-cloud-check me-2"></i>
          Dynamic{" "}
          <span>
            {query.data?.filter((row) => row.managementType === "dynamic")
              .length ?? 0}
          </span>
        </button>
        <button
          type="button"
          className={inventoryView === "caddyfile" ? "active" : ""}
          onClick={() => changeInventoryView("caddyfile")}
          aria-current={inventoryView === "caddyfile" ? "page" : undefined}
        >
          <i className="bi bi-file-earmark-code me-2"></i>
          Caddyfile-managed{" "}
          <span>
            {query.data?.filter((row) => row.managementType === "caddyfile")
              .length ?? 0}
          </span>
        </button>
      </nav>

      {feedback && (
        <div className="alert alert-danger" role="alert">
          {feedback}
        </div>
      )}
      {query.isLoading && (
        <div className="alert alert-info" role="status">
          Loading inventory...
        </div>
      )}
      {query.isError && (
        <div className="alert alert-danger" role="alert">
          Failed to load inventory:{" "}
          {query.error instanceof Error
            ? query.error.message
            : "Request failed"}
        </div>
      )}
      {!query.isLoading && !query.isError && (
        <InventoryTable
          rows={rows}
          onAction={(id, action) => updateMutation.mutate({ id, action })}
        />
      )}
    </div>
  );
}

function InventoryTable({
  rows,
  onAction,
}: {
  rows: SiteInventory[];
  onAction: (id: string, action: "ready" | "provision" | "disable") => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="card p-4 text-muted">
        No site inventory definitions yet.
      </div>
    );
  }

  return (
    <div className="card p-3 table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th>Domain</th>
            <th>Route ID</th>
            <th>Type</th>
            <th>State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.domain}</td>
              <td>
                <code>{row.routeId ?? "Caddyfile"}</code>
              </td>
              <td>{row.managementType}</td>
              <td>
                {row.state}
                {row.stateDetail && (
                  <div className="small text-danger">{row.stateDetail}</div>
                )}
              </td>
              <td className="d-flex gap-1">
                {row.managementType === "dynamic" && row.state === "draft" && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onAction(row.id, "ready")}
                  >
                    Mark ready
                  </button>
                )}
                {row.managementType === "dynamic" &&
                  ["ready", "failed", "not_provisioned"].includes(
                    row.state,
                  ) && (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => onAction(row.id, "provision")}
                    >
                      Provision
                    </button>
                  )}
                {row.managementType === "dynamic" &&
                  row.state !== "disabled" && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onAction(row.id, "disable")}
                    >
                      Disable
                    </button>
                  )}
                {row.managementType === "caddyfile" && (
                  <span className="small text-muted">Managed in Caddyfile</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
