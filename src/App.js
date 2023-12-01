import React, { Component } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class CPUSchedulingSimulation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      processes: [],
      initialProcesses: [],
      currentTime: 0,
      completedProcesses: [],
      isRunning: false,
      isSimulated: false,
      isPaused: false,
      selectedScheduleMetrics: null,
    };
    this.processNameInput = React.createRef();
    this.processArrivalTimeInput = React.createRef();
    this.processTimeInput = React.createRef();
    this.runTimeout = null;
  }

  handleRunSimulation = async () => {
    const { processes, isRunning, isPaused } = this.state;

    if (processes.length === 0) {
      alert('Danh sách tiến trình trống!');
      return;
    }

    if (isRunning) {
      alert('Mô phỏng đang chạy!');
      return;
    }

    this.setState({ isRunning: true });

    const runStep = async () => {
      if (this.state.processes.some(process => process.time > 0)) {
        if (!isPaused) {
          // Lọc danh sách các tiến trình với Arrival Time <= currentTime
          const availableProcesses = this.state.processes.filter(
            process => process.time > 0 && process.arrivalTime <= this.state.currentTime
          );

          if (availableProcesses.length === 0) {
            const newCurrentTime = this.state.currentTime + 1;
            this.setState({ currentTime: newCurrentTime });
            this.runTimeout = setTimeout(runStep, 100);
            return;
          }

          // Kiểm tra xem trong danh sách các tiến trình, tiến trình nào có CPU Burst Time ngắn nhất để chạy trước
          availableProcesses.sort((a, b) => a.time - b.time);

          const nextProcess = availableProcesses[0];

          const remainingProcesses = this.state.processes.map(process =>
            process.id === nextProcess.id ? { ...process, time: process.time - 1 } : process
          );

          const newCompletedProcesses = [
            ...this.state.completedProcesses,
            { id: nextProcess.id, startTime: this.state.currentTime, endTime: this.state.currentTime + 1 },
          ];

          const newCurrentTime = this.state.currentTime + 1;
          this.setState({ processes: remainingProcesses, completedProcesses: newCompletedProcesses, currentTime: newCurrentTime });
          if (!isPaused) {
            /* chỉnh thời gian delay khi chạy tiến trình */
            this.runTimeout = setTimeout(runStep, 400);
          }
        }
      } else {
        this.setState({ isRunning: false, isSimulated: true, isPaused: false });
      }
    };
    runStep();
  };

  sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  handleAddProcess = () => {
    const { isRunning, isSimulated } = this.state;
    const name = this.processNameInput.current.value;
    const time = parseInt(this.processTimeInput.current.value, 10);
    const arrivalTime = parseInt(this.processArrivalTimeInput.current.value, 10);

    if (isRunning) {
      alert('Dừng mô phỏng trước khi thêm tiến trình!');
      return;
    }

    if (isSimulated) {
      alert('Bạn cần ấn "Refresh" để có thể thêm tiến trình!');
      return;
    }

    if (name && time >= 0 && arrivalTime >= 0) {
      // Tạo id duy nhất cho mỗi tiến trình
      const id = Date.now();

      // Kiểm tra xem tên vừa nhập đã xuất hiện trong danh sách tiến trình hay chưa
      if (this.state.initialProcesses.some(process => process.name === name)) {
        alert('Tên tiến trình đã tồn tại. Vui lòng chọn tên khác.');
        return;
      }
      const constCPUtime = parseInt(this.processTimeInput.current.value, 10);
      // cập nhật state với tiến trình mới
      this.setState(prevState => ({
        processes: [...prevState.processes, { id, name, time, arrivalTime, constCPUtime }],
        initialProcesses: [...prevState.initialProcesses, { id, name, time, arrivalTime, constCPUtime }],
      }));
      this.processNameInput.current.value = '';
      this.processTimeInput.current.value = '';
      this.processArrivalTimeInput.current.value = '';
    } else {
      alert('Vui lòng điền đầy đủ thông tin tiến trình và đảm bảo giá trị Thời gian Đến và Thời gian Burst CPU là không âm.');
    }
  };

  handleDeleteProcess = id => {
    const { isSimulated } = this.state;

    if (isSimulated) {
      alert('Mô phỏng đã hoàn thành, bạn cần ấn "Refresh" để có thể xóa tiến trình.');
      return;
    }

    const updatedProcesses = this.state.processes.filter(process => process.id !== id);
    this.setState(prevState => ({
      processes: updatedProcesses,
      initialProcesses: prevState.initialProcesses.filter(process => process.id !== id),
      currentTime: 0,
      completedProcesses: [],
    }));
  };

  handleResetPage = () => {
    const confirmed = window.confirm('Bạn chắc chắn muốn xóa hết dữ liệu?');
    if (confirmed) {
      this.setState({
        processes: [],
        initialProcesses: [],
        currentTime: 0,
        completedProcesses: [],
        isRunning: false,
        isSimulated: false,
        isPaused: false,
      });
    }
  };

  handleReFresh = () => {
    const { initialProcesses } = this.state;
    this.setState({
      processes: [...initialProcesses],
      currentTime: 0,
      completedProcesses: [],
      isRunning: false,
      isSimulated: false,
      isPaused: false,
    });
  };

  handleStop = () => {
    this.clearRunTimeout();
  };

  handleContinue = () => {
    this.setState({ isPaused: false }, () => {
      this.runStep();
    });
  };

  runStep = () => {
    if (this.state.processes.some(process => process.time > 0)) {
      if (!this.state.isPaused) {
        const availableProcesses = this.state.processes.filter(
          process => process.time > 0 && process.arrivalTime <= this.state.currentTime
        );

        if (availableProcesses.length === 0) {
          const newCurrentTime = this.state.currentTime + 1;
          this.setState({ currentTime: newCurrentTime });
          this.runTimeout = setTimeout(this.runStep, 100);
          return;
        }

        const nextProcess = availableProcesses.reduce((min, process) => {
          return process.time < min.time ? process : min;
        }, availableProcesses[0]);

        const remainingProcesses = this.state.processes.map(process =>
          process.id === nextProcess.id ? { ...process, time: process.time - 1 } : process
        );

        const newCompletedProcesses = [
          ...this.state.completedProcesses,
          { id: nextProcess.id, startTime: this.state.currentTime, endTime: this.state.currentTime + 1 },
        ];

        const newCurrentTime = this.state.currentTime + 1;
        this.setState({ processes: remainingProcesses, completedProcesses: newCompletedProcesses, currentTime: newCurrentTime });

        if (!this.state.isPaused) {
          this.runTimeout = setTimeout(this.runStep, 400);
        }
      }
    } else {
      this.setState({ isRunning: false, isSimulated: true, isPaused: false });
    }
  };

  clearRunTimeout = () => {
    if (this.runTimeout) {
      clearTimeout(this.runTimeout);
    }
    this.setState({ isPaused: true });
  };

  calculateStatisticsForSelectedSchedule = () => {
    const { processes, completedProcesses } = this.state;

    // Kiểm tra xem đã có quá trình mô phỏng chưa
    if (completedProcesses.length === 0) {
      alert('Chưa có quá trình mô phỏng nào được thực hiện.');
      return null;
    }

    // Tính toán các giá trị thống kê dựa trên lịch trình đã chọn
    const processIds = processes.map(process => process.id);

    const selectedScheduleMetrics = {
      averageTurnaroundTime: this.calculateAverageTurnaroundTime(completedProcesses),
      averageWaitingTime: this.calculateAverageWaitingTime(completedProcesses),
      averageResponseTime: this.calculateAverageResponseTime(completedProcesses),
      perProcessMetrics: this.calculatePerProcessMetrics(processIds, completedProcesses),
    };

    return selectedScheduleMetrics;
  };

  calculateAverageTurnaroundTime = () => {
    const { processes } = this.state;
    let currentTime = 0;
    let totalTurnaroundTime = 0;

    // Sắp xếp các tiến trình theo thời gian đến (arrival time)
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

    sortedProcesses.forEach(process => {
      // Nếu tiến trình chưa đến thì chờ đến thời điểm đến của tiến trình
      if (process.arrivalTime > currentTime) {
        currentTime = process.arrivalTime;
      }

      // Tính thời gian quay vòng và cập nhật thông tin tiến trình
      process.turnaroundTime = currentTime + process.constCPUtime - process.arrivalTime;
      totalTurnaroundTime += process.turnaroundTime;
      currentTime += process.constCPUtime;
    });

    // Trả về thời gian quay vòng trung bình
    return processes.length ? totalTurnaroundTime / processes.length : 0;
  };

  // calculateAverageWaitingTime = () => {
  //   const { processes } = this.state;
  //   let currentTime = 0;
  //   let totalWaitingTime = 0;

  //   // Sắp xếp các tiến trình theo thời gian đến (arrival time)
  //   const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

  //   sortedProcesses.forEach(process => {
  //     // Nếu tiến trình chưa đến thì cập nhật thời gian hiện tại
  //     if (process.arrivalTime > currentTime) {
  //       currentTime = process.arrivalTime;
  //     }

  //     // Tính thời gian chờ của tiến trình và cập nhật thông tin tiến trình
  //     process.waitingTime = currentTime - process.arrivalTime;
  //     totalWaitingTime += process.waitingTime;

  //     // Cập nhật thời gian hiện tại dựa trên thời gian thực hiện của tiến trình
  //     currentTime += process.constCPUtime;
  //   });

  //   // Trả về thời gian chờ trung bình của tất cả các tiến trình
  //   return processes.length ? totalWaitingTime / processes.length : 0;
  // };

  calculateAverageWaitingTime = () => {
    const { processes } = this.state;
    let currentTime = 0;
    let totalWaitingTime = 0;
    let currentProcessStartTime = 0; // Thêm biến để lưu thời điểm tiến trình đang chạy bắt đầu thực hiện CPU

    // Sắp xếp các tiến trình theo thời gian đến (arrival time)
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

    sortedProcesses.forEach(process => {
      // Nếu tiến trình chưa đến thì cập nhật thời gian hiện tại
      if (process.arrivalTime > currentTime) {
        currentTime = process.arrivalTime;
      }

      // Tính thời gian chờ của tiến trình và cập nhật thông tin tiến trình
      process.waitingTime = currentTime - process.arrivalTime + (currentProcessStartTime - process.arrivalTime);
      totalWaitingTime += process.waitingTime;

      // Cập nhật thời gian hiện tại dựa trên thời gian thực hiện của tiến trình
      currentTime += process.constCPUtime;

      // Cập nhật thời gian hiện tại nếu tiến trình đã hoàn thành và tiến trình kế tiếp chưa đến
      if (process.time === 0) {
        currentTime = Math.max(currentTime, process.arrivalTime);
      }

      // Cập nhật thời điểm bắt đầu tiến trình đang chạy (đã dừng)
      currentProcessStartTime = currentTime;
    });

    // Trả về thời gian chờ trung bình của tất cả các tiến trình
    return processes.length ? totalWaitingTime / processes.length : 0;
  };


  calculateAverageResponseTime = () => {
    const { processes } = this.state;
    let currentTime = 0;
    let totalResponseTime = 0;

    // Sắp xếp các tiến trình theo thời gian đến (arrival time)
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

    sortedProcesses.forEach(process => {
      // Nếu tiến trình chưa đến thì cập nhật thời gian hiện tại
      if (process.arrivalTime > currentTime) {
        currentTime = process.arrivalTime;
      }

      // Tính thời gian đáp ứng của tiến trình và cập nhật thông tin tiến trình
      process.responseTime = currentTime - process.arrivalTime;
      totalResponseTime += process.responseTime;

      // Cập nhật thời gian hiện tại dựa trên thời gian thực hiện của tiến trình
      currentTime += process.constCPUtime;
    });

    // Trả về thời gian đáp ứng trung bình của tất cả các tiến trình
    return processes.length ? totalResponseTime / processes.length : 0;
  };

  // calculatePerProcessMetrics = (processIds, completedProcesses) => {
  //   const { processes } = this.state; // Thêm dòng này để truy cập biến processes

  //   return processIds.map(processId => {
  //     const processCompleted = completedProcesses.find(item => item.id === processId);

  //     if (processCompleted) {
  //       const constCPUtime = processes.find((process) => process.id === processId).constCPUtime;
  //       const turnaroundTime = processCompleted.endTime - processCompleted.startTime;
  //       const normalizedTurnaroundTime = turnaroundTime / constCPUtime; // Đổi constCPUtime ở đây
  //       const waitingTime = processCompleted.startTime - processes.find(process => process.id === processId).arrivalTime;
  //       const responseTime = processCompleted.startTime - processes.find(process => process.id === processId).arrivalTime;

  //       return {
  //         processName: processes.find(process => process.id === processId).name,
  //         arrivalTime: processes.find(process => process.id === processId).arrivalTime,
  //         cpuBurstTime: constCPUtime - processes.find((process) => process.id === processId).time,
  //         averageTurnaroundTime: turnaroundTime,
  //         averageNormalizedTurnaroundTime: normalizedTurnaroundTime,
  //         averageWaitingTime: waitingTime,
  //         averageResponseTime: responseTime,
  //       };
  //     } else {
  //       return {
  //         processName: 'N/A',
  //         arrivalTime: 'N/A',
  //         cpuBurstTime: 'N/A',
  //         averageTurnaroundTime: 'N/A',
  //         averageNormalizedTurnaroundTime: 'N/A',
  //         averageWaitingTime: 'N/A',
  //         averageResponseTime: 'N/A',
  //       };
  //     }
  //   });
  // };





  // Thêm hàm để xử lý sự kiện khi nhấn nút "Create statistics for selected schedule"

  calculatePerProcessMetrics = (processIds, completedProcesses) => {
    const { processes } = this.state;
  
    let isProcessRunning = false;
    let accumulatedWaitingTime = 0;
    let pauseCounters = Array(processIds.length).fill(0); // Mảng để theo dõi thời gian mỗi tiến trình bị tạm dừng
  
    return processIds.map((processId, index) => {
      const processCompleted = completedProcesses.find(item => item.id === processId);
  
      if (processCompleted) {
        const constCPUtime = processes.find((process) => process.id === processId).constCPUtime;
        const turnaroundTime = processCompleted.endTime - processCompleted.startTime;
        const normalizedTurnaroundTime = turnaroundTime / constCPUtime;
  
        // Nếu tiến trình đang chạy, cập nhật thời gian chờ tích lũy
        if (isProcessRunning) {
          accumulatedWaitingTime += 1;
        }
  
        const waitingTime = processCompleted.startTime - processes.find(process => process.id === processId).arrivalTime + accumulatedWaitingTime;
  
        // Đặt lại biến đếm thời gian chờ tích lũy
        accumulatedWaitingTime = 0;
  
        // Đặt lại trạng thái tiến trình đang chạy
        isProcessRunning = false;
  
        return {
          processName: processes.find(process => process.id === processId).name,
          arrivalTime: processes.find(process => process.id === processId).arrivalTime,
          cpuBurstTime: constCPUtime - processes.find((process) => process.id === processId).time,
          averageTurnaroundTime: turnaroundTime,
          averageNormalizedTurnaroundTime: normalizedTurnaroundTime,
          averageWaitingTime: waitingTime,
          averageResponseTime: waitingTime,
          pauseCounter: pauseCounters[index], // Trả về biến đếm thời gian bị tạm dừng
        };
      } else {
        // Nếu tiến trình đang chạy, cập nhật thời gian chờ tích lũy
        if (isProcessRunning) {
          accumulatedWaitingTime += 1;
          pauseCounters[index] += 1; // Cập nhật biến đếm thời gian bị tạm dừng
        }
  
        // Đặt lại trạng thái tiến trình đang chạy
        isProcessRunning = true;
  
        return {
          processName: 'N/A',
          arrivalTime: 'N/A',
          cpuBurstTime: 'N/A',
          averageTurnaroundTime: 'N/A',
          averageNormalizedTurnaroundTime: 'N/A',
          averageWaitingTime: 'N/A',
          averageResponseTime: 'N/A',
          pauseCounter: pauseCounters[index], // Trả về biến đếm thời gian bị tạm dừng
        };
      }
    });
  };
  



  handleCreateStatistics = () => {
    if (this.state.processes.length > 0) {
      const selectedScheduleMetrics = this.calculateStatisticsForSelectedSchedule();
      this.setState({ selectedScheduleMetrics });
    } else {
      alert('Danh sách tiến trình trống!');
    }
  };


  renderStatistics = () => {
    const { selectedScheduleMetrics } = this.state;

    return (
      <div>
        {selectedScheduleMetrics && (
          <div>
            <h4>Tất cả các tiến trình</h4>
            <table className="selected-schedule-metrics-table">
              <thead>
                <tr>
                  <th>Đại lượng</th>
                  <th>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Thời gian quay vòng trung bình</td>
                  <td>{selectedScheduleMetrics.averageTurnaroundTime}</td>
                </tr>
                <tr>
                  <td>Thời gian chờ trung bình</td>
                  <td>{selectedScheduleMetrics.averageWaitingTime}</td>
                </tr>
                <tr>
                  <td>Thời gian đáp ứng trung bình</td>
                  <td>{selectedScheduleMetrics.averageResponseTime}</td>
                </tr>
              </tbody>
            </table>

            <h4>Số liệu trên mỗi tiến trình</h4>
            <table className="per-process-metrics-table">
              <thead>
                <tr>
                  <th>Process Name  |</th>
                  <th>Arrival Time   |</th>
                  <th>CPU Burst Time   |</th>
                  <th>Thời gian quay vòng trung bình  |</th>
                  <th>Thời gian quay vòng bình thường hóa trung bình  |</th>
                  <th>Thời gian chờ trung bình   |</th>
                  <th>Thời gian phản hồi trung bình  |</th>
                </tr>
              </thead>
              <tbody>
                {selectedScheduleMetrics.perProcessMetrics.map((process, index) => (
                  <tr key={index}>
                    <td>{process.processName}</td>
                    <td>{process.arrivalTime}</td>
                    <td>{process.cpuBurstTime}</td>
                    <td>{process.averageTurnaroundTime}</td>
                    <td>{process.averageNormalizedTurnaroundTime}</td>
                    <td>{process.averageWaitingTime}</td>
                    <td>{process.averageResponseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };


  render() {
    const { initialProcesses, isRunning, isSimulated, isPaused } = this.state;
    const totalTime = 200;
    const columnWidth = 10;
    const currentTime = this.state.currentTime;

    return (
      <div className="container-fluid cpu-scheduling-simulation">
        <div class="row">
          <div className="col-mt-2 tieuDe">
            <p>Nguyên lý hệ điều hành</p>
            <p>Mô phỏng giải thuật lập lịch CPU SRTF (Shortest Remaining Time First)</p>
          </div>
        </div>
        <br />

        <div class="row dinhNghia">
          <div className=' container-fluid  thanhNgang'>Định nghĩa</div>
          <div><br /> </div>
          <div class="col add-process-form">
            <br />
            <p className='phongChu'>Thêm tiến trình</p>
            <input type="text" placeholder="Process name" ref={this.processNameInput} />
            <input type="number" placeholder="Arrival Time" ref={this.processArrivalTimeInput} />
            <input type="number" placeholder="CPU Burst Time" ref={this.processTimeInput} />
            <button onClick={this.handleAddProcess}>Add</button>
          </div>
          <div className="col process-list">
            <br />
            <p className='phongChu'>Danh sách các tiến trình</p>
            <table style={{ width: 600 }}>
              <thead>
                <tr>
                  <th>Process name</th>
                  <th>Arrival Time</th>
                  <th>CPU Burst Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {initialProcesses.map(process => (
                  <tr key={process.id}>
                    <td>{process.name}</td>
                    <td>{process.arrivalTime}</td>
                    <td>
                      {process.name === 'CPU Burst Time' ? (
                        <div>{process.time}</div>
                      ) : (
                        process.time
                      )}
                    </td>
                    <td>
                      <button onClick={() => this.handleDeleteProcess(process.id)} disabled={isRunning}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div><br /> </div>
        </div>
        <br />
        <div className="controls">
          <div>
            <button onClick={isRunning ? null : isSimulated ? this.handleReFresh : this.handleRunSimulation} disabled={isRunning}>
              {isRunning ? 'Running...' : isSimulated ? 'Refresh' : 'Run'}
            </button>
            <button onClick={this.handleResetPage} disabled={isRunning}>
              Reset
            </button>
            <button onClick={this.handleStop} disabled={!isRunning || isPaused}>
              Stop
            </button>
            <button onClick={this.handleContinue} disabled={!isPaused || isSimulated}>
              Continue
            </button>
          </div>
        </div>
        <br />

        <div class="row moPhong">
          <div className=' container-fluid  thanhNgang'>Mô phỏng</div>
          <div className="table-container">
            <div className="table-scroll">
              <table className="process-table">
                <thead>
                  <tr>
                    <th>Process name</th>
                    {Array(totalTime)
                      .fill()
                      .map((_, index) => (
                        <th
                          key={index}
                          className={currentTime === index + 1 ? 'running' : ''}
                          style={{ width: columnWidth }}
                        >
                          {index}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {initialProcesses.map(process => (
                    <tr key={process.id}>
                      <td>{process.name}</td>
                      {Array(totalTime)
                        .fill()
                        .map((_, index) => (
                          <td
                            key={index}
                            className={
                              this.state.completedProcesses.some(item => {
                                return item.id === process.id && index >= item.startTime && index < item.endTime;
                              })
                                ? 'completed'
                                : ''
                            }
                            style={{ width: columnWidth }}
                          ></td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <br />

        <div className="row soLieuThongKe">
          <div className="container-fluid thanhNgang">Số liệu thống kê</div>
          {this.renderStatistics()}
          <button onClick={this.handleCreateStatistics}>Tạo số liệu thống kê</button>
        </div>

      </div>
    );
  }
}

function App() {
  return (
    <div className="App" >
      <CPUSchedulingSimulation />
    </div>
  );
}

export default App;