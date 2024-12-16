import { useState, useEffect } from 'react';
import { Table, Card, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import Snowfall from 'react-snowfall';
import axios from 'axios';
import 'antd/dist/reset.css';

const TimeTable = () => {
    const [timetable, setTimetable] = useState([]);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [snowIntensity, setSnowIntensity] = useState(0);

    const timePeriods = ['Sáng', 'Chiều', 'Tối'];
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

    // Fetch timetable data from API
    useEffect(() => {
        fetchTimetable();
    }, [currentWeek]);



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


    


    const fetchTimetable = async () => {
        try {
            const response = await axios.get(import.meta.env.VITE_API_URL + '/api/timetable');
            setTimetable(response.data);
        } catch (error) {
            message.error('Lỗi tải thời khóa biểu.' + `Mã lỗi ${error.status}`);
        }
    };

    useEffect(() => {
        fetchTimetable();

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

    const weekDates = getDatesForWeek(currentWeek);

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
        normalized.setHours(0, 0, 0, 0); // Set to midnight
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
