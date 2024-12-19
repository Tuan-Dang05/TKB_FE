import { useState, useEffect } from 'react';
import { Table, Card, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import Snowfall from 'react-snowfall';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const TimeTable = () => {
    const [timetable, setTimetable] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [snowIntensity, setSnowIntensity] = useState(0);

    const timePeriods = ['Sáng', 'Chiều', 'Tối'];
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    const CustomSnowflake = () => {
        return (
            <div
                style={{
                    width: '12px',
                    height: '12px',
                    background: 'linear-gradient(45deg, #94CFE3, #F7E7E2)',
                    borderRadius: '50%',
                    boxShadow: '0 0 5px rgba(255, 255, 255, 0.8)',
                }}
            />
        );
    };

    const loadTimetableFromStorage = () => {
        try {
            const storedData = localStorage.getItem('timetable');
            if (storedData) {
                setTimetable(JSON.parse(storedData));
            }
        } catch (error) {
            console.error('Error loading timetable:', error);
            message.error('Lỗi khi tải thời khóa biểu');
        }
    };

    const saveToStorage = (data) => {
        try {
            localStorage.setItem('timetable', JSON.stringify(data));
            setTimetable(data);
        } catch (error) {
            console.error('Error saving timetable:', error);
            message.error('Lỗi khi lưu thời khóa biểu');
        }
    };

    // Hàm chuyển đổi thời gian từ Excel sang định dạng HH:mm
const convertExcelTimeToHHMM = (excelTime) => {
    if (!excelTime) return '00:00';
    
    // Nếu đã là string format HH:mm thì trả về luôn
    if (typeof excelTime === 'string' && excelTime.includes(':')) {
        return excelTime;
    }

    // Chuyển đổi từ số thập phân Excel sang giờ:phút
    const totalSeconds = Math.round(excelTime * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    // Format thành chuỗi HH:mm
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

   // Cập nhật hàm processExcelData
const processExcelData = (data) => {
    return data.map((row, index) => {
        console.log('Processing row:', row);
        
        // Xử lý trường 'Thứ'
        let thu = '';
        if (row['Thứ'] !== undefined && row['Thứ'] !== null) {
            thu = row['Thứ'].toString();
        } else {
            console.warn(`Missing 'Thứ' for row ${index + 1}`);
            thu = '2';
        }

        // Xử lý thời gian
        const gioBatDau = convertExcelTimeToHHMM(row['Giờ Bắt Đầu']);
        const gioKetThuc = convertExcelTimeToHHMM(row['Giờ Kết Thúc']);

        console.log('Converted times:', {
            original: {
                start: row['Giờ Bắt Đầu'],
                end: row['Giờ Kết Thúc']
            },
            converted: {
                start: gioBatDau,
                end: gioKetThuc
            }
        });

        return {
            id: index + 1,
            ten_hoc_phan: row['Tên Học Phần'] || 'Chưa có tên',
            ma_hoc_phan: row['Mã HP'] || 'Chưa có mã',
            tiet_hoc: row['Tiết Học'] || '',
            ngay_bat_dau: excelDateToJSDate(row['Ngày Bắt Đầu']) || new Date().toISOString(),
            ngay_ket_thuc: excelDateToJSDate(row['Ngày Kết Thúc']) || new Date().toISOString(),
            thu: thu,
            gio_bat_dau: gioBatDau + ':00',
            gio_ket_thuc: gioKetThuc + ':00',
            phong_hoc: row['Phòng Học'] || 'Chưa có phòng'
        };
    }).filter(item => {
        const isValid = item.ten_hoc_phan !== 'Chưa có tên' && 
                       item.ma_hoc_phan !== 'Chưa có mã';
        if (!isValid) {
            console.warn('Filtered out invalid row:', item);
        }
        return isValid;
    });
};

    // Helper function to convert Excel dates to JS dates
   // Helper function to convert Excel dates
const excelDateToJSDate = (excelDate) => {
    if (!excelDate) return null;
    
    // Nếu là chuỗi ngày tháng, parse trực tiếp
    if (typeof excelDate === 'string') {
        // Thử parse với format dd/MM/yyyy
        const parts = excelDate.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return new Date(year, month - 1, day).toISOString();
        }
        return new Date(excelDate).toISOString();
    }

    // Nếu là số (Excel date)
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString();
};

    useEffect(() => {
        loadTimetableFromStorage();

        const checkSeasonalSnow = () => {
            const today = new Date();
            const month = today.getMonth() + 1;
            const date = today.getDate();

            if (month === 12 || month === 1 || month === 2) {
                setSnowIntensity(0.5);
            }

            if ((month === 12 && date >= 24 && date <= 26) || (month === 1 && date === 1)) {
                setSnowIntensity(0.8);
            }
        };

        checkSeasonalSnow();
    }, []);

    const uploadProps = {
        name: 'file',
        accept: '.xlsx,.xls',
        beforeUpload: (file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const data = XLSX.utils.sheet_to_json(worksheet);
                    
                    console.log('Raw Excel Data:', data); // Log dữ liệu thô
                    
                    if (data.length === 0) {
                        throw new Error('No data found in Excel file');
                    }
    
                    // Log cấu trúc của dòng đầu tiên
                    console.log('First row structure:', Object.keys(data[0]));
                    
                    const processedData = processExcelData(data);
                    console.log('Processed Data:', processedData); // Log dữ liệu đã xử lý
                    
                    if (processedData.length === 0) {
                        throw new Error('No valid data after processing');
                    }
    
                    saveToStorage(processedData);
                    message.success(`${file.name} đã được tải lên thành công`);
                } catch (error) {
                    console.error('Error details:', error);
                    message.error(`Lỗi khi xử lý file Excel: ${error.message}`);
                }
            };
            reader.readAsArrayBuffer(file);
            return false;
        }
    };

    const getStartOfWeek = (date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Adjust when it's Sunday
        start.setDate(start.getDate() + diff);
        return start;
    };

    const getDatesForWeek = (date) => {
        const startOfWeek = getStartOfWeek(date);
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
    };

    const formatDate = (date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const classifyPeriod = (time) => {
        const hour = parseInt(time.split(':')[0], 10);
        if (hour < 12) return 'Sáng';
        if (hour < 17) return 'Chiều';
        return 'Tối';
    };

    const normalizeDate = (date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    const renderCellContent = (day, period) => {
        return timetable
            .filter((entry) => {
                const startDate = normalizeDate(new Date(entry.ngay_bat_dau));
                const endDate = normalizeDate(new Date(entry.ngay_ket_thuc));
                const entryPeriod = classifyPeriod(entry.gio_bat_dau);

                const normalizedDay = normalizeDate(day);
                const dayOfWeek = normalizedDay.getDay() === 0 ? 7 : normalizedDay.getDay() + 1;
                const entryDayOfWeek = parseInt(entry.thu);

                return (
                    normalizedDay >= startDate &&
                    normalizedDay <= endDate &&
                    dayOfWeek === entryDayOfWeek &&
                    entryPeriod === period
                );
            })
            .map((entry) => (
                <Card
                    key={entry.id}
                    className="timetable-card bg-pink-100 shadow-sm p-0 text-xs"
                    bordered={true}
                    style={{ marginBottom: '10px', fontSize: '0.6rem', maxWidth: '200px' }}
                >
                    <p className="font-bold">{entry.ten_hoc_phan}</p>
                    <p><span className='font-bold'>Mã HP:</span> {entry.ma_hoc_phan}</p>
                    <p><span className='font-bold'>Tiết:</span> {entry.tiet_hoc}</p>
                    <p>
                        <span className='font-bold'>Giờ:</span> {entry.gio_bat_dau.replace(/:00$/, '')} - {entry.gio_ket_thuc.replace(/:00$/, '')}
                    </p>
                    <p><span className='font-bold'>Phòng:</span> {entry.phong_hoc}</p>
                </Card>
            ));
    };

    const handleWeekChange = (direction) => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(currentWeek.getDate() + direction * 7);
        setCurrentWeek(newWeek);
    };

    const weekDates = getDatesForWeek(currentWeek);

    return (
        <div className="min-h-screen bg-pink-50 p-0">
            <Snowfall
                snowflakeCount={200}
                snowflakeFactory={(index) => (
                    <CustomSnowflake key={index} />
                )}
                style={{
                    position: 'fixed',
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                }}
            />
            <div className="container-fluid mx-auto bg-white shadow-lg rounded-lg p-2">
                <h1 className="text-2xl font-bold mb-4 text-center">💗 Lịch học của bạn nhỏ 💗</h1>
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <Button
                        onClick={() => handleWeekChange(-1)}
                        className="w-full md:w-auto"
                        size="large"
                    >
                        Tuần Trước
                    </Button>
                    <Upload {...uploadProps}>
                        <Button
                            icon={<UploadOutlined />}
                            className="w-full md:w-auto"
                            size="large"
                        >
                            Tải File Excel
                        </Button>
                    </Upload>
                    <Button
                        onClick={() => handleWeekChange(1)}
                        className="w-full md:w-auto"
                        size="large"
                    >
                        Tuần Tiếp
                    </Button>
                </div>

                <Table
                    bordered
                    dataSource={timePeriods.map((period) => ({
                        key: period,
                        period,
                        ...daysOfWeek.reduce((acc, date, index) => {
                            acc[daysOfWeek[index]] = renderCellContent(weekDates[index], period);
                            return acc;
                        }, {}),
                    }))}
                    columns={[
                        {
                            title: '',
                            dataIndex: 'period',
                            key: 'period',
                            className: 'bg-pink-200 font-bold text-center',
                        },
                        ...daysOfWeek.map((day, index) => ({
                            title: (
                                <div className="text-center">
                                    <div className="font-semibold">{day}</div>
                                    <div className="text-sm text-gray-500">{formatDate(weekDates[index])}</div>
                                </div>
                            ),
                            dataIndex: day,
                            key: day,
                            render: (_, record) => <div className="p-2">{record[day]}</div>,
                        })),
                    ]}
                    pagination={false}
                    rowKey="key"
                    className="table-responsive"
                    scroll={{ x: 'max-content' }}
                />
            </div>
        </div>
    );
};

export default TimeTable;