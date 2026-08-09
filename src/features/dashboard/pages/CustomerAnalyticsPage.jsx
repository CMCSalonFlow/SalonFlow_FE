import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Card, Button, Space, message } from 'antd';
import { TeamOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
import CustomerKpiCards from '../components/CustomerKpiCards';
import CustomerSegmentationChart from '../components/CustomerSegmentationChart';
import ConversionFunnelChart from '../components/ConversionFunnelChart';
import CustomerSegmentTable from '../components/CustomerSegmentTable';
import TargetedCampaignModal from '../components/TargetedCampaignModal';

import {
    getCustomerOverviewApi,
    getCustomerFunnelApi,
    getCustomersBySegmentApi
} from '../api/customerAnalyticsApi';

const { Title, Text } = Typography;

export default function CustomerAnalyticsPage({ branchId = null }) {
    const [overviewData, setOverviewData] = useState(null);
    const [funnelData, setFunnelData] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [totalElements, setTotalElements] = useState(0);

    const [loadingOverview, setLoadingOverview] = useState(false);
    const [loadingFunnel, setLoadingFunnel] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const [selectedSegment, setSelectedSegment] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [campaignModalVisible, setCampaignModalVisible] = useState(false);
    const [targetSegmentForCampaign, setTargetSegmentForCampaign] = useState('AT_RISK');

    const loadData = async () => {
        try {
            setLoadingOverview(true);
            setLoadingFunnel(true);
            setLoadingTable(true);

            const [ov, fn] = await Promise.all([
                getCustomerOverviewApi(branchId),
                getCustomerFunnelApi(branchId)
            ]);

            setOverviewData(ov);
            setFunnelData(fn);
        } catch (err) {
            console.error('Error loading customer analytics:', err);
            message.error('Không thể tải dữ liệu phân tích khách hàng');
        } finally {
            setLoadingOverview(false);
            setLoadingFunnel(false);
        }
    };

    const loadTableData = async () => {
        try {
            setLoadingTable(true);
            const res = await getCustomersBySegmentApi(branchId, selectedSegment, searchQuery, page, pageSize);
            if (res) {
                setCustomers(res.content || []);
                setTotalElements(res.totalElements || 0);
            }
        } catch (err) {
            console.error('Error loading customers table:', err);
        } finally {
            setLoadingTable(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [branchId]);

    useEffect(() => {
        loadTableData();
    }, [branchId, selectedSegment, searchQuery, page, pageSize]);

    const handleOpenCampaignModal = (seg = 'AT_RISK') => {
        setTargetSegmentForCampaign(seg);
        setCampaignModalVisible(true);
    };

    const handleCampaignSuccess = () => {
        // Cập nhật ngầm dữ liệu mà không bật spinner loading gián đoạn UI
        getCustomerOverviewApi(branchId).then(ov => ov && setOverviewData(ov)).catch(() => {});
        getCustomerFunnelApi(branchId).then(fn => fn && setFunnelData(fn)).catch(() => {});
        getCustomersBySegmentApi(branchId, selectedSegment, searchQuery, page, pageSize)
            .then(res => {
                if (res) {
                    setCustomers(res.content || []);
                    setTotalElements(res.totalElements || 0);
                }
            })
            .catch(() => {});
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Space size={10} align="center">
                        <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#e6f7ff', color: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                            <TeamOutlined />
                        </div>
                        <div>
                            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                                Phân tích & Phân loại Khách hàng (Customer Analytics)
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Theo dõi phân khúc (New, Returning, VIP, At-risk), phễu chuyển đổi, công thức CLV và khởi tạo chiến dịch AI
                            </Text>
                        </div>
                    </Space>
                </div>

                <Space size={12}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={loadData}
                        style={{ borderRadius: 10 }}
                    >
                        Làm mới
                    </Button>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        style={{ borderRadius: 10, background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', border: 'none' }}
                        onClick={() => handleOpenCampaignModal('AT_RISK')}
                    >
                        Chiến Dịch Nhắm Mục Tiêu
                    </Button>
                </Space>
            </div>

            {/* KPI Cards Row */}
            <CustomerKpiCards overviewData={overviewData} loading={loadingOverview} />

            {/* Segmentation & Funnel Charts Row */}
            <Row gutter={[20, 20]}>
                <Col xs={24} lg={12}>
                    <CustomerSegmentationChart
                        overviewData={overviewData}
                        onSelectSegment={(seg) => setSelectedSegment(seg)}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <ConversionFunnelChart
                        funnelData={funnelData}
                        loading={loadingFunnel}
                    />
                </Col>
            </Row>

            {/* Customers Data Table */}
            <CustomerSegmentTable
                customers={customers}
                totalElements={totalElements}
                loading={loadingTable}
                selectedSegment={selectedSegment}
                onSegmentChange={(seg) => {
                    setSelectedSegment(seg);
                    setPage(0);
                }}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                    setSearchQuery(q);
                    setPage(0);
                }}
                page={page}
                pageSize={pageSize}
                onPageChange={(p, s) => {
                    setPage(p);
                    setPageSize(s);
                }}
                onOpenCampaignModal={handleOpenCampaignModal}
            />

            {/* Targeted Campaign Modal */}
            <TargetedCampaignModal
                visible={campaignModalVisible}
                onClose={() => setCampaignModalVisible(false)}
                initialSegment={targetSegmentForCampaign}
                branchId={branchId}
                onSuccess={handleCampaignSuccess}
            />
        </div>
    );
}
