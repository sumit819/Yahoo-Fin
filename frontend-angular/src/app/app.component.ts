import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports:[FormsModule ,CommonModule, HttpClientModule,MatFormFieldModule, AgGridModule, MatTableModule,MatPaginatorModule,MatSortModule,MatButtonModule ]
})
export class AppComponent implements AfterViewInit{
  apiUrl:string= "http://localhost:5000"
  @ViewChild('lineChart', { static: false }) lineChartContainer!: ElementRef;
  @ViewChild('barChart', { static: false }) barChartContainer!: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  stockSymbol: string = 'AAPL';
  stockHistory: any[] = [];
  errorMessage: string = '';
  filteredData: any[] = [];
  stockData:any = []
  dataSource = new MatTableDataSource<any>([]); 
  searchTerm: string = "";
  currentPage =1;
  displayedColumns: string[] = ['Symbol', 'Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
rowsPerPage = 10;
  columns_0 = [{ prop: 'name' }, { name: 'Gender' }, { name: 'Company' }];
  pageIndex = 0;
  columns = [
    { prop: "Symbol", name: "Symbol",  width: 300 },
    { prop: "Date", name: "Date" , width: 300},
    { prop: "Open", name: "Open Price" ,width: 300},
    { prop: "High", name: "High Price" , width: 300},
    { prop: "Low", name: "Low Price" , width: 300},
    { prop: "Close", name: "Close Price" , width: 300},
    { prop: "Volume", name: "Volume" , width: 300}
  ];
  length: number = 0;
  pageSize: number = 5;
  laodinglineChart: boolean = true;
  laodingBarChart: boolean = true;
  
  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
    setTimeout(() => this.dataSource.paginator = this.paginator);
    setTimeout(() => this.dataSource.sort = this.sort);
    console.log(this.paginator)
    console.log(this.sort)
  }
  rowData: any[] = [];
  stockDetails: any;

  constructor(private http: HttpClient) {
    this.getStockData()
    this.getStockInfo()
    this.getStockDetails()
  }
  handlePageEvent(event: PageEvent) {
    console.log(event)
    this.length = event.length;
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }
  totalPages(): number {
    return this.filteredData.length;
  }
  
  onPageChange(event: any) {
    console.log(event)
    this.currentPage = event.offset;
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }
  
  nextPage() {
    if (this.currentPage < this.filteredData.length - 1) {
      this.currentPage++;
    }
  }
  filterTable() {
    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.stockDetails.filter(
      (row:any) =>
        row.Symbol.toLowerCase().includes(term)   
    );
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }
  getStockData() {
    if (!this.stockSymbol.trim()) {
      this.errorMessage = 'Please enter a stock symbol!';
      return;
    }
    
    this.http.get(this.apiUrl + `/stock/`).subscribe(
      (data:any) => {
        
        this.stockDetails = data;
        this.filteredData = [...this.stockDetails];
        console.log(data)
        this.errorMessage = '';
        
        this.dataSource = new MatTableDataSource(this.filteredData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        
        
        
      },
      (error) => {
        this.errorMessage = 'Error fetching stock data.' + JSON.stringify(error);
        console.log(this.errorMessage)
        this.stockDetails = null;
      }
    );

   
  }
  getStockInfo() {
    this.http
    .get(this.apiUrl + `/stock/details/${this.stockSymbol}`)
    .subscribe(
      (data: any) => {
        
        this.stockData = data;
        this.errorMessage = '';

        this.createLineChart();
        this.createBarChart();
      },
      (error) => {
        this.stockHistory = [];
        this.rowData = [];
        this.errorMessage = 'Error fetching stock history.';
      }
    );
    this.getStockDetails()
  }
  getStockDetails(){
    this.http
    .get(this.apiUrl +  `/stock/history/${this.stockSymbol}`)
    .subscribe(
      (data: any) => {
        
        this.stockHistory = data.map((d: any) => ({
          ...d,
          Date: new Date(d.Date).toISOString().split('T')[0], // Format date
        }));

        this.rowData = this.stockHistory;
        this.errorMessage = '';

        this.createLineChart();
        this.createBarChart();
      },
      (error) => {
        this.stockHistory = [];
        this.rowData = [];
        this.errorMessage = 'Error fetching stock history.';
      }
    );
  }

  createLineChart() {
    this.laodinglineChart = true;
    d3.select(this.lineChartContainer.nativeElement).selectAll('*').remove();
  
    const width = 800, height = 300;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
  
    const svg = d3.select(this.lineChartContainer.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleTime()
      .domain(d3.extent(this.stockHistory, d => new Date(d.Date)) as [Date, Date])
      .range([0, width - margin.left - margin.right]);
  
    const y = d3.scaleLinear()
      .domain([
        d3.min(this.stockHistory, d => d.Close)! * 0.95, 
        d3.max(this.stockHistory, d => d.Close)! * 1.05
      ])
      .range([height - margin.top - margin.bottom, 0]);
  
    // X-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom - margin.top})`)
      .call(d3.axisBottom(x).ticks(5));
  
    // Y-axis
    svg.append('g')
      .call(d3.axisLeft(y));
  
    // Line path
    const line = d3.line<{ Date: string; Close: number }>()
      .x(d => x(new Date(d.Date))!)
      .y(d => y(d.Close)!);
  
    svg.append('path')
      .datum(this.stockHistory)
      .attr('fill', 'none')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2)
      .attr('d', line);
  
    // Tooltip div (hidden by default)
    const tooltip = d3.select(this.lineChartContainer.nativeElement)
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("padding", "8px")
      .style("border-radius", "5px")
      .style("box-shadow", "0px 0px 5px #aaa")
      .style("pointer-events", "none");
  
    // Circles on data points (for hover interaction)
    svg.selectAll("circle")
      .data(this.stockHistory)
      .enter()
      .append("circle")
      .attr("cx", d => x(new Date(d.Date))!)
      .attr("cy", d => y(d.Close)!)
      .attr("r", 5)
      .attr("fill", "red")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("r", 8);
        tooltip.style("visibility", "visible")
          .html(`📅 <strong>${d.Date}</strong><br>💰 Close: ${d.Close}`)
          .style("top", `${event.pageY - 30}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("top", `${event.pageY - 30}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("r", 5);
        tooltip.style("visibility", "hidden");
      });
      this.laodinglineChart = false;
  }
  


  createBarChart() {
    this.laodingBarChart = true;
    d3.select(this.barChartContainer.nativeElement).selectAll('*').remove();
  
    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
  
    const svg = d3.select(this.barChartContainer.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
    // X Scale
    const x = d3.scaleBand()
      .domain(this.stockHistory.map(d => d.Date))
      .range([0, width])
      .padding(0.2);
  
    // Y Scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(this.stockHistory, d => d.Volume)!])
      .nice()
      .range([height, 0]);
  
    // X Axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x)
        .tickValues(this.stockHistory.map((d, i) => i % 5 === 0 ? d.Date : null).filter(d => d))
      )
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px');
  
    // Y Axis
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));
  
    // Tooltip div (hidden by default)
    const tooltip = d3.select(this.barChartContainer.nativeElement)
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("padding", "8px")
      .style("border-radius", "5px")
      .style("box-shadow", "0px 0px 5px #aaa")
      .style("pointer-events", "none");
  
    // Bars with hover effect
    svg.selectAll('.bar')
      .data(this.stockHistory)
      .enter()
      .append('rect')
      .attr('x', d => x(d.Date)!)
      .attr('y', d => y(d.Volume)!)
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.Volume)!)
      .attr('fill', 'orange')
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("fill", "darkorange");
        tooltip.style("visibility", "visible")
          .html(`📅 <strong>${d.Date}</strong><br>📊 Volume: ${d.Volume.toLocaleString()}`)
          .style("top", `${event.pageY - 30}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("top", `${event.pageY - 30}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "orange");
        tooltip.style("visibility", "hidden");
      });
      this.laodingBarChart =  false;
  }
  
}