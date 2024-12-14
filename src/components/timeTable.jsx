import { useState, useEffect } from 'react';
import { Table, Card, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import 'antd/dist/reset.css';

const TimeTable = () => {
    const [timetable, setTimetable] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    const timePeriods = ['Sáng', 'Chiều', 'Tối'];
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    // Fetch timetable data from API
    useEffect(() => {
        fetchTimetable();
    }, [currentWeek]);

    const fetchTimetable = async () => {
        try {
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/timetable');
            setTimetable(response.data);
        } catch (error) {
            message.error('Lỗi tải thời khóa biểu');
        }
    };

    const uploadProps = {
        name: 'file',
        action: `${import.meta.env.VITE_API_URL}/api/upload-timetable`,
        headers: {
            authorization: 'authorization-text',
        },
        onChange(info) {
            if (info.file.status === 'done') {
                message.success(`${info.file.name} tải lên thành công`);
                fetchTimetable();
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} tải lên thất bại.`);
            }
        },
    };

    // Get start date of the current week
    const getStartOfWeek = (date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Adjust when it's Sunday
        start.setDate(start.getDate() + diff);
        return start;
    };

    // Get dates for the current week
    const getDatesForWeek = (date) => {
        const startOfWeek = getStartOfWeek(date);
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
    };

    const weekDates = getDatesForWeek(currentWeek);

    // Format date to DD/MM/YYYY
    const formatDate = (date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const classifyPeriod = (time) => {
        const hour = parseInt(time.split(':')[0], 10);
        if (hour < 12) return 'Sáng';
        if (hour < 18) return 'Chiều';
        return 'Tối';
    };

    const renderCellContent = (day, period) => {
        return timetable
            .filter((entry) => {
                const entryDate = new Date(entry.ngay_hoc);
                const entryPeriod = classifyPeriod(entry.gio_bat_dau);
                return entryDate.toDateString() === day.toDateString() && entryPeriod === period;
            })
            .map((entry) => (
                <Card
                    key={entry.id}
                    className="timetable-card bg-gray-100 shadow-md p-0 text-sm"
                    bordered={false}
                >
                    <p className="font-semibold">{entry.ten_hoc_phan}</p>
                    <p>Mã HP: {entry.ma_hoc_phan}</p>
                    <p>Tiết: {entry.tiet_hoc}</p>
                    <p>Giờ: {entry.gio_bat_dau} - {entry.gio_ket_thuc}</p>
                    <p>Phòng: {entry.phong_hoc}</p>
                </Card>
            ));
    };

    const handleWeekChange = (direction) => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(currentWeek.getDate() + direction * 7);
        setCurrentWeek(newWeek);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="container mx-auto bg-white shadow-lg rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">Quản Lý Thời Khóa Biểu</h1>
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <Button
                        onClick={() => handleWeekChange(-1)}
                        className="w-full md:w-auto"
                        size="large"
                    >
                        Tuần Trước
                    </Button>
                    <Upload {...uploadProps} accept=".xlsx,.xls" className="">
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
                        ...weekDates.reduce((acc, date, index) => {
                            acc[daysOfWeek[index]] = renderCellContent(date, period);
                            return acc;
                        }, {}),
                    }))}
                    columns={[
                        {
                            title: '',
                            dataIndex: 'period',
                            key: 'period',
                            className: 'bg-gray-100 font-bold text-center',
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
