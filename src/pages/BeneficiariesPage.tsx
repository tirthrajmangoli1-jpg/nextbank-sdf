import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Clock,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { beneficiaryApi } from '../api';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Select } from '../components/common/Select';
import { useBank } from '../context/BankContext';
import { useToast } from '../context/ToastContext';
import { Beneficiary } from '../types';
import { BeneficiaryFormData, beneficiarySchema } from '../utils/validators';

export const BeneficiariesPage: React.FC = () => {
  const { beneficiaries, refreshBeneficiaries } = useBank();
  const { success, error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'FAVORITES' | 'COOLING'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  // 1-second interval to update cooling period countdowns live
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      accountType: 'SAVINGS',
    },
  });

  const onAddSubmit = async (data: BeneficiaryFormData) => {
    setIsSubmitting(true);
    try {
      await beneficiaryApi.addBeneficiary({
        name: data.name,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
        accountType: data.accountType,
      });
      await refreshBeneficiaries();
      setIsAddModalOpen(false);
      reset();
      success(
        'Beneficiary Added',
        `${data.name} added. 30-second cooling period is now active for account security.`
      );
    } catch (err) {
      toastError(
        'Failed to add beneficiary',
        err instanceof Error ? err.message : 'Please check details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await beneficiaryApi.toggleFavorite(id);
      await refreshBeneficiaries();
    } catch (err) {
      toastError('Error', 'Failed to update favorite status.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await beneficiaryApi.deleteBeneficiary(id);
      await refreshBeneficiaries();
      setDeletingId(null);
      success('Beneficiary Deleted', 'Beneficiary has been removed from your list.');
    } catch (err) {
      toastError('Delete Failed', 'Unable to delete beneficiary.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBeneficiary) return;
    try {
      await beneficiaryApi.updateBeneficiary(editingBeneficiary.id, {
        name: editingBeneficiary.name,
      });
      await refreshBeneficiaries();
      setEditingBeneficiary(null);
      success('Updated', 'Beneficiary details updated.');
    } catch (err) {
      toastError('Update Failed', 'Unable to save changes.');
    }
  };

  // Filter & Search logic
  const filtered = beneficiaries.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accountNumber.includes(searchQuery) ||
      b.ifscCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'FAVORITES') return b.isFavorite;
    if (filterTab === 'COOLING') {
      const isCooling =
        b.status === 'COOLING_PERIOD' && new Date(b.coolingPeriodEnd).getTime() > nowTimestamp;
      return isCooling;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Beneficiary Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your verified payees, favorites, and 30-second cooling period status.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="text-xs font-bold"
        >
          Add Beneficiary
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-navy-900 rounded-2xl border border-slate-200/80 dark:border-navy-800 text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'ALL'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({beneficiaries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('FAVORITES')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filterTab === 'FAVORITES'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Favorites</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('COOLING')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              filterTab === 'COOLING'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Cooling Period</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, bank, or IFSC..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Beneficiaries Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No Beneficiaries Found"
          description={
            searchQuery
              ? `No payees matched "${searchQuery}".`
              : 'Add your first beneficiary to enable instant 1-click transfers.'
          }
          actionLabel="Add Beneficiary"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => {
            const coolingEnd = new Date(b.coolingPeriodEnd).getTime();
            const isCooling = b.status === 'COOLING_PERIOD' && coolingEnd > nowTimestamp;
            const secondsLeft = Math.max(0, Math.ceil((coolingEnd - nowTimestamp) / 1000));

            return (
              <Card
                key={b.id}
                className="p-5 space-y-4 hover:border-brand-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-sm">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {b.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{b.bankName}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(b.id, e)}
                    className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                    title={b.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        b.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-navy-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      •••• {b.accountNumber.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IFSC:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {b.ifscCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {b.accountType}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between pt-1">
                  {isCooling ? (
                    <Badge variant="warning" size="sm" className="gap-1 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>Cooling ({secondsLeft}s)</span>
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm" className="gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Active</span>
                    </Badge>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingBeneficiary(b)}
                      title="Edit beneficiary name"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(b.id)}
                      title="Delete beneficiary"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Beneficiary Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Beneficiary"
        description="Newly added payees undergo a 30-second security cooling period."
      >
        <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Chandra"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Account Number"
            placeholder="9 to 18 digits"
            error={errors.accountNumber?.message}
            {...register('accountNumber')}
          />

          <Input
            label="Confirm Account Number"
            placeholder="Re-enter account number"
            error={errors.confirmAccountNumber?.message}
            {...register('confirmAccountNumber')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="IFSC Code"
              placeholder="e.g. NEXT0001001"
              error={errors.ifscCode?.message}
              {...register('ifscCode')}
            />
            <Input
              label="Bank Name"
              placeholder="e.g. NextBank or HDFC"
              error={errors.bankName?.message}
              {...register('bankName')}
            />
          </div>

          <Select
            label="Account Type"
            error={errors.accountType?.message}
            options={[
              { value: 'SAVINGS', label: 'Savings Account' },
              { value: 'CURRENT', label: 'Current Account' },
            ]}
            {...register('accountType')}
          />

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              A 30-second cooling period will be applied before transfers can be initiated.
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="flex-1 text-xs font-bold"
            >
              Add Beneficiary
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Beneficiary Modal */}
      {editingBeneficiary && (
        <Modal
          isOpen={true}
          onClose={() => setEditingBeneficiary(null)}
          title="Edit Beneficiary Name"
        >
          <div className="space-y-4">
            <Input
              label="Beneficiary Name"
              value={editingBeneficiary.name}
              onChange={(e) =>
                setEditingBeneficiary({ ...editingBeneficiary, name: e.target.value })
              }
            />
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingBeneficiary(null)}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                className="flex-1 text-xs font-bold"
              >
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingId(null)}
          title="Delete Beneficiary"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to remove this payee? You will need to re-add them and undergo a new cooling period to transfer funds in the future.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeletingId(null)}
                className="flex-1 text-xs"
              >
                Keep
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 text-xs font-bold"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
