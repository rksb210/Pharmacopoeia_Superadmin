import React, { useState } from 'react';
import { Plus, Download, Filter } from 'lucide-react';
import PageContainer from '../../components/admin/common/PageContainer';
import PageHeader from '../../components/admin/common/PageHeader';
import StatCard from '../../components/admin/common/StatCard';
import AdminTableWrapper from '../../components/admin/common/AdminTableWrapper';
import AdminModal from '../../components/admin/common/AdminModal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';

/**
 * Reusable placeholder template page for Admin modules
 */
export const AdminModulePlaceholderPage = ({
  moduleId,
  title,
  description,
  stats = [],
  sampleColumns = ['ID', 'Name / Entity', 'Category', 'Status', 'Updated At'],
  sampleData = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const defaultStats = stats.length > 0 ? stats : [
    { title: `Total ${title}`, value: '128', subtitle: 'Registered in database' },
    { title: `Active ${title}`, value: '114', subtitle: 'Operating normally' },
    { title: 'Pending Review', value: '14', subtitle: 'Awaiting authorization' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={description || `Manage and configure ${title.toLowerCase()} on the National Formulary of India platform.`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert(`Exporting ${title} report...`)}
          className="rounded-xl text-xs font-semibold"
        >
          <Download className="w-4 h-4 mr-1.5" />
          <span>Export</span>
        </Button>

        <Button
          variant="nfiYellow"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl text-xs font-bold shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>Add {title.slice(-1) === 's' ? title.slice(0, -1) : title}</span>
        </Button>
      </PageHeader>

      {/* Domain KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {defaultStats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            trend={stat.trend || null}
          />
        ))}
      </div>

      {/* Domain Table Wrapper */}
      <AdminTableWrapper
        title={`${title} Directory`}
        subtitle={`Live records and management interface for ${title.toLowerCase()}.`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        isEmpty={sampleData.length === 0}
        emptyTitle={`No ${title.toLowerCase()} records yet`}
        emptyDescription={`Get started by creating your first entry in the ${title} module.`}
        emptyActionLabel={`Create ${title.slice(-1) === 's' ? title.slice(0, -1) : title}`}
        onEmptyAction={() => setIsCreateModalOpen(true)}
      >
        {sampleData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {sampleColumns.map((col, idx) => (
                  <TableHead key={idx}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-500">
                    {row.id || `#${idx + 100}`}
                  </TableCell>
                  <TableCell className="font-bold text-slate-800 text-xs">
                    {row.name || row.title || 'Record'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {row.category || 'General'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="nfiYellow" className="text-[10px] font-bold">
                      {row.status || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
                    {row.updatedAt || 'Today'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AdminTableWrapper>

      {/* Creation Modal Foundation */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`Add New ${title.slice(-1) === 's' ? title.slice(0, -1) : title}`}
        description={`Configure details to register a new entry in ${title}.`}
        confirmLabel="Save Entry"
        onConfirm={() => {
          alert('Record draft saved successfully.');
          setIsCreateModalOpen(false);
        }}
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Entity Title / Name</label>
            <input
              type="text"
              placeholder={`Enter ${title.toLowerCase()} title`}
              className="w-full h-10 px-3 border border-slate-200 rounded-xl outline-none focus:border-[#E76120]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Description / Notes</label>
            <textarea
              rows={3}
              placeholder="Enter details..."
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#E76120]"
            />
          </div>
        </div>
      </AdminModal>
    </PageContainer>
  );
};

export default AdminModulePlaceholderPage;
