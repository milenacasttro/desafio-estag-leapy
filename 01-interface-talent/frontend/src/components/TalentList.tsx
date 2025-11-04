"use client";

import { useState, useEffect, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { fetchTalents, fetchLeaders, fetchTargetRoles } from "@/lib/directus";
import type { Talent, DirectusListResponse, Leader, TargetRole } from "@/lib/directus";

export default function TalentList() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("-date_updated");
  const [filters, setFilters] = useState({
    department: "",
    current_status: "",
    orchestrator_state: "",
    pdi_plan_ready: "",
    start_date: "",
    end_date: "",
    leader_id: "",
    target_role_id: "",
  });
  
  const [filterOptions, setFilterOptions] = useState({
    departments: [] as string[],
    statuses: [] as string[],
    orchestratorStates: [] as string[],
    leaders: [] as Leader[],
    roles: [] as TargetRole[],
  });

  const debouncedSearchHandler = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 500);

  useEffect(() => {
    debouncedSearchHandler(search);
  }, [search, debouncedSearchHandler]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [talentsResult, leadersResult, rolesResult] = await Promise.all([
          fetchTalents({
            limit: "1000",
            fields: "department,current_status,orchestrator_state",
          }),
          fetchLeaders(),
          fetchTargetRoles(),
        ]);

        const depts = new Set<string>();
        const statuses = new Set<string>();
        const states = new Set<string>();

        talentsResult.data.forEach((talent) => {
          if (talent.department) depts.add(talent.department);
          if (talent.current_status) statuses.add(talent.current_status);
          if (talent.orchestrator_state) states.add(talent.orchestrator_state);
        });

        setFilterOptions({
          departments: Array.from(depts).sort(),
          statuses: Array.from(statuses).sort(),
          orchestratorStates: Array.from(states).sort(),
          leaders: leadersResult.data || [],
          roles: rolesResult.data || [],
        });
      } catch (err) {
        console.error("Erro ao carregar opções dos filtros:", err);
        setFilterOptions({
          departments: [],
          statuses: [],
          orchestratorStates: [],
          leaders: [],
          roles: [],
        });
      }
    }

    loadFilterOptions();
  }, []);

  useEffect(() => {
    async function loadTalents() {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, string> = {
          page: page.toString(),
          limit: limit.toString(),
          [`sort[]`]: sortField,
          fields: "*,leader_id.id,leader_id.department,leader_id.position,target_role_id.id,target_role_id.name,user_id.email",
        };

        if (filters.department) {
          params[`filter[department][_eq]`] = filters.department;
        }
        if (filters.current_status) {
          params[`filter[current_status][_eq]`] = filters.current_status;
        }
        if (filters.orchestrator_state) {
          params[`filter[orchestrator_state][_eq]`] = filters.orchestrator_state;
        }
        if (filters.pdi_plan_ready !== "") {
          params[`filter[pdi_plan_ready][_eq]`] = filters.pdi_plan_ready;
        }
        if (filters.start_date || filters.end_date) {
          if (filters.start_date) {
            params[`filter[end_date][_gte]`] = filters.start_date;
          }
          if (filters.end_date) {
            params[`filter[start_date][_lte]`] = filters.end_date;
          }
        }
        if (filters.leader_id) {
          params[`filter[leader_id][_eq]`] = filters.leader_id;
        }
        if (filters.target_role_id) {
          params[`filter[target_role_id][_eq]`] = filters.target_role_id;
        }

        if (debouncedSearch) {
          params[`filter[user_id][email][_icontains]`] = debouncedSearch;
        }

        const result: DirectusListResponse<Talent> = await fetchTalents(params);
        setTalents(result.data);
        
        const hasFilters = filters.department || filters.current_status || 
                          filters.orchestrator_state || filters.pdi_plan_ready !== "" || 
                          filters.start_date || filters.end_date ||
                          filters.leader_id || filters.target_role_id ||
                          debouncedSearch;
        
        let totalCount = 0;
        
        if (hasFilters) {
          totalCount = result.meta?.filter_count ?? result.meta?.total_count ?? result.meta?.total ?? 0;
        } else {
          totalCount = result.meta?.total_count ?? result.meta?.total ?? 0;
        }

        if (result.data.length === 0 && page > 1) {
          const maxPossibleTotal = (page - 1) * limit;
          if (totalCount > maxPossibleTotal) {
          }
        }
        
        const calculatedPageCount = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
        
        if (calculatedPageCount === 0 && page > 1) {
          setPage(1);
          return;
        }
        
        setTotal(totalCount);
        setPageCount(calculatedPageCount);
      } catch (err) {
        setError("Erro ao carregar talentos. Tente novamente.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTalents();
  }, [page, limit, sortField, filters, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearch]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortField(`-${field}`);
    } else if (sortField === `-${field}`) {
      setSortField(field);
    } else {
      setSortField(field);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(talents.map(t => t.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const clearFilters = () => {
    setFilters({
      department: "",
      current_status: "",
      orchestrator_state: "",
      pdi_plan_ready: "",
      start_date: "",
      end_date: "",
      leader_id: "",
      target_role_id: "",
    });
    setSearch("");
    setDebouncedSearch("");
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(v => v !== "") || debouncedSearch !== "";
  }, [filters, debouncedSearch]);

  const getSortIcon = (field: string) => {
    if (sortField === field) {
      return "↑";
    } else if (sortField === `-${field}`) {
      return "↓";
    }
    return "⇅";
  };

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Pesquise por email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => alert("Funcionalidade de exportação em desenvolvimento")}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Filtros Básicos</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="relative">
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className={`appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                    filters.department ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                >
                  <option value="">Departamento</option>
                  {filterOptions.departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={filters.current_status}
                  onChange={(e) => setFilters({ ...filters, current_status: e.target.value })}
                  className={`appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                    filters.current_status ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                >
                  <option value="">Status</option>
                  {filterOptions.statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={filters.orchestrator_state}
                  onChange={(e) => setFilters({ ...filters, orchestrator_state: e.target.value })}
                  className={`appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                    filters.orchestrator_state ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                >
                  <option value="">Orchestrator</option>
                  {filterOptions.orchestratorStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={filters.pdi_plan_ready}
                  onChange={(e) => setFilters({ ...filters, pdi_plan_ready: e.target.value })}
                  className={`appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                    filters.pdi_plan_ready !== "" ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                >
                  <option value="">PDI Pronto</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Período</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className={`appearance-none bg-white border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  filters.start_date ? "border-green-500 bg-green-50" : "border-gray-300"
                }`}
              />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className={`appearance-none bg-white border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  filters.end_date ? "border-green-500 bg-green-50" : "border-gray-300"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Relacionamentos</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  value={filters.leader_id}
                  onChange={(e) => setFilters({ ...filters, leader_id: e.target.value })}
                  className={`appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                    filters.leader_id ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                >
                  <option value="">Líder</option>
                  {filterOptions.leaders.length === 0 ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    filterOptions.leaders.map(leader => (
                      <option key={leader.id} value={leader.id.toString()}>
                        {leader.department || "Sem dept"} - {leader.position || `ID ${leader.id}`}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={filters.target_role_id}
                  onChange={(e) => setFilters({ ...filters, target_role_id: e.target.value })}
                  className={`appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-full ${
                    filters.target_role_id ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                >
                  <option value="">Role Alvo</option>
                  {filterOptions.roles.length === 0 ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    filterOptions.roles.map(role => (
                      <option key={role.id} value={role.id.toString()}>
                        {role.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Carregando talentos...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {talents.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">Nenhum talento encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === talents.length && talents.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("department")}
                    >
                      <div className="flex items-center gap-1">
                        Departamento
                        <span className="text-gray-400">{getSortIcon("department")}</span>
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("current_status")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <span className="text-gray-400">{getSortIcon("current_status")}</span>
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("orchestrator_state")}
                    >
                      <div className="flex items-center gap-1">
                        Orchestrator
                        <span className="text-gray-400">{getSortIcon("orchestrator_state")}</span>
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      PDI
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("date_updated")}
                    >
                      <div className="flex items-center gap-1">
                        Atualizado
                        <span className="text-gray-400">{getSortIcon("date_updated")}</span>
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Líder
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role Alvo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {talents.map((talent: Talent) => (
                    <tr
                      key={talent.id}
                      className={`hover:bg-gray-50 transition-colors ${selectedRows.has(talent.id) ? 'bg-green-50' : ''}`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(talent.id)}
                          onChange={(e) => handleSelectRow(talent.id, e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {talent.department || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {talent.current_status ? (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {talent.current_status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {talent.orchestrator_state ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                            {talent.orchestrator_state}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {talent.pdi_plan_ready ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Pronto
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          {talent.date_updated ? (
                            <span suppressHydrationWarning>
                              {new Date(talent.date_updated).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                              })}
                            </span>
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {talent.leader_id && typeof talent.leader_id === 'object' ? (
                          <div className="text-xs text-gray-900">
                            <div className="font-medium">
                              {talent.leader_id.department || "—"}
                            </div>
                            <div className="text-gray-500">
                              {talent.leader_id.position || "—"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {talent.target_role_id && typeof talent.target_role_id === 'object' ? (
                          <span className="text-xs text-gray-900">
                            {talent.target_role_id.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Linhas por página:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <span className="text-sm text-gray-600">
                Mostrando {startItem} a {endItem} de {total} itens
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ««
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                «
              </button>
              
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                let pageNum;
                if (pageCount <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pageCount - 2) {
                  pageNum = pageCount - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 border rounded text-sm ${
                      page === pageNum
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-300 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pageCount}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                »
              </button>
              <button
                onClick={() => setPage(pageCount)}
                disabled={page >= pageCount}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
