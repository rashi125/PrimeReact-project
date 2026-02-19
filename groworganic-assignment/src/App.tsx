import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";
import { fetchArtworks } from "./service/api";
import "./App.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  date_start?: number;
  date_end?: number;
  inscriptions?: string;
}

const ArtworkTable: React.FC = () => {
  const [data, setData] = useState<Artwork[]>([]);
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);
  const [rowsToSelect, setRowsToSelect] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);


  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const overlayRef = useRef<OverlayPanel>(null);

  
  const fetchData = async (page: number, number: number) => {
    try {
      setLoading(true);
      const res = await fetchArtworks(page, number);
      setData(res.data); // current page data only
      setTotalRecords(res.total);
    } catch (error) {
      console.error("API Fetch Error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on page change
  useEffect(() => {
    const page = first / rows + 1; // API is 1-based
    fetchData(page, rows);
  }, [first, rows]);

  // 🎯 CORE LOGIC (NO PREFETCH, CURRENT PAGE ONLY)
  const handleCustomRowSelect = () => {
    if (!rowsToSelect || rowsToSelect <= 0) return;

  
    const count = Math.min(rowsToSelect, data.length);
    const rowsToBeSelected = data.slice(0, count);

    setSelectedRows(rowsToBeSelected);
    overlayRef.current?.hide();
    setRowsToSelect(null);
  };

  
  const selectionHeader = () => {
    const allSelected =
      data.length > 0 && selectedRows.length === data.length;

    return (
      <div className="header-container" style ={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Select All (current page only) */}
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows([...data]); // only current page rows
            } else {
              setSelectedRows([]);
            }
          }}
        />

        
        <div
          className="dropdown-trigger"
          onClick={(e) => overlayRef.current?.toggle(e)}
        >
          <i className="pi pi-chevron-down" style ={{backgroundColor: "#f3f4f6"}}></i>
        </div>

        <OverlayPanel ref={overlayRef} style={{backgroundColor:"whitesmoke", padding:"2.3rem"}}>
          <div className="custom-panel">
            <h4 className="panel-title" style={{color: "#333"}}>
              Select the number of rows you want
            </h4>

            <p className="panel-subtitle" style={{color: "#333"}}>
              Selection will apply only on current page rows
            </p>

            <div className="panel-input-row">
              <InputNumber
                value={rowsToSelect ?? undefined}
                onValueChange={(e) =>
                  setRowsToSelect(e.value ?? null)
                }
                min={1}
                max={data.length}
                placeholder="Enter number of rows"
                className="rows-input"
                style={{width: "100%",marginBottom: "0.5rem",height: "2.5rem"}}
              />

              <Button
                label="Apply"
                icon="pi pi-check"
                onClick={handleCustomRowSelect}
              />
            </div>
          </div>
        </OverlayPanel>
      </div>
    );
  };

  // Pagination change
  const onPageChange = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
    setSelectedRows([]); // reset selection on page change
  };

  return (
    <div className="card">
      {/* Heading */}
      <div className="selected-heading">
        Selected Rows: {selectedRows.length}
      </div>

      {/* DataTable */}
      <DataTable
        value={data}
        loading={loading}
        lazy
        dataKey="id"
        selection={selectedRows}
        onSelectionChange={(e) =>
          setSelectedRows(e.value as Artwork[])
        }
        responsiveLayout="scroll"
      >
        {/* Dropdown BEFORE title (left side) */}
        <Column
          header={selectionHeader}
          selectionMode="multiple"
          style={{ width: "4rem" }}
        />

        <Column field="title" header="TITLE" />
        <Column field="place_of_origin" header="PLACE OF ORIGIN" />
        <Column field="artist_display" header="ARTIST" />
        <Column field="inscriptions" header="INSCRIPTIONS" />
        <Column field="date_start" header="START DATE" />
        <Column field="date_end" header="END DATE" />
      </DataTable>

      {/* External Paginator (as you were using) */}
      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        // rowsPerPageOptions={[10, 20, 50]}
        onPageChange={onPageChange}
        template="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink CurrentPageReport"
      />
    </div>
  );
};

export default ArtworkTable;