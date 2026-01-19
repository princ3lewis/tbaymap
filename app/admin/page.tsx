'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import {
  AdminDevice,
  AdminDeviceStatus,
  AdminUser,
  AdminWaitlistEntry,
  BatchStatus,
  DeviceInput,
  FirmwareRelease,
  FirmwareStatus,
  InventoryItem,
  ManufacturingBatch,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  QaReport,
  QaResult,
  Shipment,
  ShipmentStatus,
  addAdmin,
  createBatch,
  createDevice,
  createFirmwareRelease,
  createInventoryItem,
  createPurchaseOrder,
  createQaReport,
  createShipment,
  deleteDevice,
  deleteWaitlistEntry,
  removeAdmin,
  pingDevice,
  subscribeToAdminStatus,
  subscribeToAdmins,
  subscribeToBatches,
  subscribeToDevices,
  subscribeToFirmware,
  subscribeToInventory,
  subscribeToPurchaseOrders,
  subscribeToQaReports,
  subscribeToShipments,
  subscribeToWaitlist,
  updateBatch,
  updateDevice,
  updateDeviceStage,
  updateFirmwareRelease,
  updateInventoryItem,
  updatePurchaseOrder,
  updateShipment,
  updateWaitlistEntry
} from '../../services/adminService';
import { deleteEvent, subscribeToEvents } from '../../services/eventsService';
import {
  MANUFACTURING_STAGES,
  ManufacturingStageStatus
} from '../../data/manufacturingStages';
import { WaitlistDeviceType } from '../../services/waitlistService';
import { TbayEvent } from '../../types';

const deviceStatusOptions: AdminDeviceStatus[] = ['online', 'offline', 'maintenance'];
const deviceTypeOptions: WaitlistDeviceType[] = ['Bracelet', 'Necklace', 'Ring'];
const lifecycleOptions = ['new', 'encoding', 'calibration', 'ready', 'assigned', 'retired'];
const waitlistStatusOptions = ['new', 'contacted', 'invited', 'converted', 'archived'];
const stageStatusOptions: ManufacturingStageStatus[] = [
  'not_started',
  'in_progress',
  'blocked',
  'pass',
  'fail',
  'skipped'
];
const batchStatusOptions: BatchStatus[] = ['planned', 'in_progress', 'paused', 'complete'];
const purchaseOrderStatusOptions: PurchaseOrderStatus[] = [
  'draft',
  'ordered',
  'received',
  'closed',
  'cancelled'
];
const firmwareStatusOptions: FirmwareStatus[] = ['draft', 'testing', 'released', 'deprecated'];
const qaResultOptions: QaResult[] = ['pass', 'fail', 'rework'];
const shipmentStatusOptions: ShipmentStatus[] = ['packing', 'label_created', 'shipped', 'delivered'];
const stagesByPhase = MANUFACTURING_STAGES.reduce<Record<string, typeof MANUFACTURING_STAGES>>(
  (acc, stage) => {
    if (!acc[stage.phase]) {
      acc[stage.phase] = [];
    }
    acc[stage.phase].push(stage);
    return acc;
  },
  {}
);

const formatDate = (value?: Date | null) => (value ? value.toLocaleString() : '—');

export default function AdminPage() {
  const { user, loading, signOut, enabled } = useAuth();
  const userEmail = user?.email?.toLowerCase() ?? '';

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminStatus, setAdminStatus] = useState<'checking' | 'admin' | 'none'>('checking');
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<AdminWaitlistEntry[]>([]);
  const [events, setEvents] = useState<TbayEvent[]>([]);
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, InventoryItem>>({});
  const [inventorySavingId, setInventorySavingId] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [firmwareReleases, setFirmwareReleases] = useState<FirmwareRelease[]>([]);
  const [qaReports, setQaReports] = useState<QaReport[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [deviceDrafts, setDeviceDrafts] = useState<Record<string, DeviceInput>>({});
  const [deviceSavingId, setDeviceSavingId] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [stageDrafts, setStageDrafts] = useState<Record<string, { status: ManufacturingStageStatus; notes: string }>>({});
  const [stageSaving, setStageSaving] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);

  const [newDevice, setNewDevice] = useState<DeviceInput>({
    deviceId: '',
    serial: '',
    label: '',
    type: 'Bracelet',
    status: 'offline',
    battery: 100,
    batchId: '',
    lifecycle: 'new',
    assignedTo: '',
    firmware: '',
    keyId: '',
    notes: ''
  });
  const [createStatus, setCreateStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const isAdmin = adminStatus === 'admin';

  const [adminEmailDraft, setAdminEmailDraft] = useState('');
  const [adminAction, setAdminAction] = useState<'idle' | 'saving' | 'error' | 'success'>('idle');
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  const [newBatch, setNewBatch] = useState<Omit<ManufacturingBatch, 'id' | 'createdAt'>>({
    name: '',
    status: 'planned',
    targetCount: 0,
    notes: ''
  });
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const [newInventoryItem, setNewInventoryItem] = useState<
    Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    sku: '',
    supplier: '',
    category: '',
    onHand: 0,
    reorderPoint: 0,
    unitCost: 0,
    leadTimeDays: 0,
    location: '',
    notes: ''
  });
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);

  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [poItemDraft, setPoItemDraft] = useState<PurchaseOrderItem>({
    sku: '',
    name: '',
    qty: 1,
    unitCost: 0
  });
  const [newPo, setNewPo] = useState<Omit<PurchaseOrder, 'id' | 'createdAt'>>({
    supplier: '',
    status: 'draft',
    items: [],
    orderedAt: null,
    expectedAt: null,
    notes: ''
  });
  const [poMessage, setPoMessage] = useState<string | null>(null);

  const [newFirmware, setNewFirmware] = useState<Omit<FirmwareRelease, 'id' | 'createdAt'>>({
    version: '',
    status: 'draft',
    checksum: '',
    notes: ''
  });
  const [firmwareMessage, setFirmwareMessage] = useState<string | null>(null);

  const [newQaReport, setNewQaReport] = useState<Omit<QaReport, 'id' | 'createdAt'>>({
    deviceId: '',
    result: 'rework',
    summary: '',
    issues: '',
    createdBy: ''
  });
  const [qaMessage, setQaMessage] = useState<string | null>(null);

  const [newShipment, setNewShipment] = useState<Omit<Shipment, 'id' | 'createdAt'>>({
    carrier: '',
    tracking: '',
    status: 'packing',
    deviceIds: [],
    recipientName: '',
    address: '',
    notes: ''
  });
  const [shipmentMessage, setShipmentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userEmail) {
      setAdminStatus('checking');
      return;
    }
    const unsubscribeStatus = subscribeToAdminStatus(userEmail, (nextIsAdmin) => {
      setAdminStatus(nextIsAdmin ? 'admin' : 'none');
    });
    return () => unsubscribeStatus();
  }, [enabled, userEmail]);

  useEffect(() => {
    if (!enabled || !isAdmin) {
      return;
    }
    const unsubscribeAdmins = subscribeToAdmins(setAdmins);
    const unsubscribeDevices = subscribeToDevices(setDevices);
    const unsubscribeWaitlist = subscribeToWaitlist(setWaitlistEntries);
    const unsubscribeEvents = subscribeToEvents(setEvents);
    const unsubscribeBatches = subscribeToBatches(setBatches);
    const unsubscribeInventory = subscribeToInventory(setInventoryItems);
    const unsubscribePurchaseOrders = subscribeToPurchaseOrders(setPurchaseOrders);
    const unsubscribeFirmware = subscribeToFirmware(setFirmwareReleases);
    const unsubscribeQa = subscribeToQaReports(setQaReports);
    const unsubscribeShipments = subscribeToShipments(setShipments);
    return () => {
      unsubscribeAdmins();
      unsubscribeDevices();
      unsubscribeWaitlist();
      unsubscribeEvents();
      unsubscribeBatches();
      unsubscribeInventory();
      unsubscribePurchaseOrders();
      unsubscribeFirmware();
      unsubscribeQa();
      unsubscribeShipments();
    };
  }, [enabled, isAdmin]);

  useEffect(() => {
    if (adminStatus === 'admin') {
      return;
    }
    setAdmins([]);
    setDevices([]);
    setWaitlistEntries([]);
    setEvents([]);
    setBatches([]);
    setInventoryItems([]);
    setPurchaseOrders([]);
    setFirmwareReleases([]);
    setQaReports([]);
    setShipments([]);
  }, [adminStatus]);

  useEffect(() => {
    setDeviceDrafts((prev) => {
      const next = { ...prev };
      devices.forEach((device) => {
        if (!next[device.id]) {
          next[device.id] = {
            deviceId: device.deviceId,
            serial: device.serial ?? '',
            label: device.label,
            type: device.type,
            status: device.status,
            battery: device.battery,
            batchId: device.batchId ?? '',
            lifecycle: device.lifecycle ?? '',
            assignedTo: device.assignedTo ?? '',
            firmware: device.firmware ?? '',
            keyId: device.keyId ?? '',
            notes: device.notes ?? ''
          };
        }
      });
      Object.keys(next).forEach((id) => {
        if (!devices.some((device) => device.id === id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [devices]);

  useEffect(() => {
    setStageDrafts((prev) => {
      const next = { ...prev };
      devices.forEach((device) => {
        MANUFACTURING_STAGES.forEach((stage) => {
          const key = `${device.id}:${stage.id}`;
          if (!next[key]) {
            const stageData = device.stages?.[stage.id];
            next[key] = {
              status: stageData?.status ?? 'not_started',
              notes: stageData?.notes ?? ''
            };
          }
        });
      });
      Object.keys(next).forEach((key) => {
        const deviceId = key.split(':')[0];
        if (!devices.some((device) => device.id === deviceId)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [devices]);

  useEffect(() => {
    setInventoryDrafts((prev) => {
      const next = { ...prev };
      inventoryItems.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = item;
        }
      });
      Object.keys(next).forEach((id) => {
        if (!inventoryItems.some((item) => item.id === id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [inventoryItems]);

  const handleDraftChange = (id: string, field: keyof DeviceInput, value: string | number) => {
    setDeviceDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const stageKey = (deviceId: string, stageId: string) => `${deviceId}:${stageId}`;

  const handleStageDraftChange = (
    deviceId: string,
    stageId: string,
    field: 'status' | 'notes',
    value: ManufacturingStageStatus | string
  ) => {
    const key = stageKey(deviceId, stageId);
    setStageDrafts((prev) => ({
      ...prev,
      [key]: {
        status: prev[key]?.status ?? 'not_started',
        notes: prev[key]?.notes ?? '',
        [field]: value
      }
    }));
  };

  const handleSaveStage = async (deviceId: string, stageId: string) => {
    const key = stageKey(deviceId, stageId);
    const draft = stageDrafts[key];
    if (!draft) {
      return;
    }
    setStageSaving(key);
    setStageError(null);
    try {
      await updateDeviceStage(deviceId, stageId, {
        status: draft.status,
        notes: draft.notes,
        updatedBy: userEmail
      });
    } catch (error) {
      console.error('Failed to update stage:', error);
      setStageError('Unable to update manufacturing stage.');
    } finally {
      setStageSaving(null);
    }
  };

  const generateDeviceId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      setNewDevice((prev) => ({ ...prev, deviceId: crypto.randomUUID() }));
      return;
    }
    const fallback = `device_${Math.random().toString(36).slice(2, 10)}`;
    setNewDevice((prev) => ({ ...prev, deviceId: fallback }));
  };

  const generateSerial = () => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    setNewDevice((prev) => ({ ...prev, serial: `TB-${year}${month}${day}-${rand}` }));
  };

  const handleSaveDevice = async (id: string) => {
    const draft = deviceDrafts[id];
    if (!draft) {
      return;
    }
    setDeviceSavingId(id);
    setDeviceError(null);
    try {
      await updateDevice(id, {
        ...draft,
        battery: Number.isFinite(draft.battery) ? Number(draft.battery) : 0
      });
    } catch (error) {
      console.error('Failed to update device:', error);
      setDeviceError('Unable to update device settings.');
    } finally {
      setDeviceSavingId(null);
    }
  };

  const handleCreateDevice = async (event: React.FormEvent) => {
    event.preventDefault();
    const label = newDevice.label.trim();
    const serial = newDevice.serial?.trim();
    const deviceId = newDevice.deviceId?.trim();
    if (!label || !serial || !deviceId) {
      setCreateStatus('error');
      setCreateMessage('Add a device ID, label, and serial for the device.');
      return;
    }
    setCreateStatus('saving');
    setCreateMessage(null);
    try {
      await createDevice({
        ...newDevice,
        id: deviceId,
        deviceId,
        label,
        serial,
        battery: Math.max(0, Math.min(100, newDevice.battery))
      });
      setNewDevice({
        deviceId: '',
        serial: '',
        label: '',
        type: 'Bracelet',
        status: 'offline',
        battery: 100,
        batchId: '',
        lifecycle: 'new',
        assignedTo: '',
        firmware: '',
        keyId: '',
        notes: ''
      });
      setCreateStatus('success');
      setCreateMessage('Device registered.');
    } catch (error) {
      console.error('Failed to create device:', error);
      setCreateStatus('error');
      setCreateMessage('Unable to register device.');
    }
  };

  const handleWaitlistStatus = async (entryId: string, status: string) => {
    try {
      await updateWaitlistEntry(entryId, { status });
    } catch (error) {
      console.error('Failed to update waitlist entry:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Remove this event from the system?')) {
      return;
    }
    try {
      await deleteEvent(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!window.confirm('Delete this device record?')) {
      return;
    }
    try {
      await deleteDevice(deviceId);
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  const handleDeleteWaitlistEntry = async (entryId: string) => {
    if (!window.confirm('Archive this waitlist entry?')) {
      return;
    }
    try {
      await deleteWaitlistEntry(entryId);
    } catch (error) {
      console.error('Failed to delete waitlist entry:', error);
    }
  };

  const handleCreateBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newBatch.name.trim();
    if (!name) {
      setBatchMessage('Add a batch name.');
      return;
    }
    try {
      await createBatch({
        name,
        status: newBatch.status,
        targetCount: Math.max(0, newBatch.targetCount),
        notes: newBatch.notes ?? ''
      });
      setNewBatch({ name: '', status: 'planned', targetCount: 0, notes: '' });
      setBatchMessage('Batch created.');
    } catch (error) {
      console.error('Failed to create batch:', error);
      setBatchMessage('Unable to create batch.');
    }
  };

  const handleBatchStatusChange = async (id: string, status: BatchStatus) => {
    try {
      await updateBatch(id, { status });
    } catch (error) {
      console.error('Failed to update batch:', error);
      setBatchMessage('Unable to update batch.');
    }
  };

  const handleBatchNotes = async (id: string, notes: string) => {
    try {
      await updateBatch(id, { notes });
    } catch (error) {
      console.error('Failed to update batch notes:', error);
    }
  };

  const handleInventoryDraftChange = (id: string, field: keyof InventoryItem, value: string | number) => {
    setInventoryDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleInventorySave = async (id: string) => {
    const draft = inventoryDrafts[id];
    if (!draft) {
      return;
    }
    setInventorySavingId(id);
    setInventoryMessage(null);
    try {
      await updateInventoryItem(id, {
        name: draft.name,
        sku: draft.sku,
        supplier: draft.supplier ?? '',
        category: draft.category ?? '',
        onHand: Number(draft.onHand) || 0,
        reorderPoint: Number(draft.reorderPoint) || 0,
        unitCost: Number(draft.unitCost) || 0,
        leadTimeDays: Number(draft.leadTimeDays) || 0,
        location: draft.location ?? '',
        notes: draft.notes ?? ''
      });
      setInventoryMessage('Inventory updated.');
    } catch (error) {
      console.error('Failed to update inventory:', error);
      setInventoryMessage('Unable to update inventory.');
    } finally {
      setInventorySavingId(null);
    }
  };

  const handleCreateInventoryItem = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newInventoryItem.name.trim();
    const sku = newInventoryItem.sku.trim();
    if (!name || !sku) {
      setInventoryMessage('Add a part name and SKU.');
      return;
    }
    try {
      await createInventoryItem({
        ...newInventoryItem,
        name,
        sku,
        onHand: Number(newInventoryItem.onHand) || 0,
        reorderPoint: Number(newInventoryItem.reorderPoint) || 0,
        unitCost: Number(newInventoryItem.unitCost) || 0,
        leadTimeDays: Number(newInventoryItem.leadTimeDays) || 0
      });
      setNewInventoryItem({
        name: '',
        sku: '',
        supplier: '',
        category: '',
        onHand: 0,
        reorderPoint: 0,
        unitCost: 0,
        leadTimeDays: 0,
        location: '',
        notes: ''
      });
      setInventoryMessage('Inventory item added.');
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      setInventoryMessage('Unable to add inventory item.');
    }
  };

  const handleAddPoItem = () => {
    if (!poItemDraft.name.trim() || !poItemDraft.sku.trim()) {
      setPoMessage('Add SKU and item name.');
      return;
    }
    setPoItems((prev) => [...prev, { ...poItemDraft }]);
    setPoItemDraft({ sku: '', name: '', qty: 1, unitCost: 0 });
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handlePurchaseOrderStatus = async (id: string, status: PurchaseOrderStatus) => {
    try {
      await updatePurchaseOrder(id, { status });
    } catch (error) {
      console.error('Failed to update purchase order:', error);
    }
  };

  const handleCreatePurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPo.supplier.trim()) {
      setPoMessage('Add a supplier name.');
      return;
    }
    if (poItems.length === 0) {
      setPoMessage('Add at least one line item.');
      return;
    }
    try {
      await createPurchaseOrder({
        supplier: newPo.supplier.trim(),
        status: newPo.status,
        items: poItems,
        orderedAt: newPo.orderedAt ?? null,
        expectedAt: newPo.expectedAt ?? null,
        notes: newPo.notes ?? ''
      });
      setNewPo({ supplier: '', status: 'draft', items: [], orderedAt: null, expectedAt: null, notes: '' });
      setPoItems([]);
      setPoMessage('Purchase order created.');
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      setPoMessage('Unable to create purchase order.');
    }
  };

  const handleCreateFirmware = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newFirmware.version.trim()) {
      setFirmwareMessage('Add a firmware version.');
      return;
    }
    try {
      await createFirmwareRelease({
        version: newFirmware.version.trim(),
        status: newFirmware.status,
        checksum: newFirmware.checksum ?? '',
        notes: newFirmware.notes ?? ''
      });
      setNewFirmware({ version: '', status: 'draft', checksum: '', notes: '' });
      setFirmwareMessage('Firmware release added.');
    } catch (error) {
      console.error('Failed to create firmware release:', error);
      setFirmwareMessage('Unable to create firmware release.');
    }
  };

  const handleFirmwareStatus = async (id: string, status: FirmwareStatus) => {
    try {
      await updateFirmwareRelease(id, { status });
    } catch (error) {
      console.error('Failed to update firmware status:', error);
    }
  };

  const handleCreateQaReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newQaReport.deviceId.trim()) {
      setQaMessage('Select a device.');
      return;
    }
    try {
      await createQaReport({
        deviceId: newQaReport.deviceId.trim(),
        result: newQaReport.result,
        summary: newQaReport.summary ?? '',
        issues: newQaReport.issues ?? '',
        createdBy: userEmail
      });
      setNewQaReport({ deviceId: '', result: 'rework', summary: '', issues: '', createdBy: '' });
      setQaMessage('QA report saved.');
    } catch (error) {
      console.error('Failed to create QA report:', error);
      setQaMessage('Unable to save QA report.');
    }
  };

  const handleCreateShipment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newShipment.deviceIds.length === 0) {
      setShipmentMessage('Add at least one device ID.');
      return;
    }
    try {
      await createShipment({
        ...newShipment,
        carrier: newShipment.carrier ?? '',
        tracking: newShipment.tracking ?? '',
        status: newShipment.status,
        deviceIds: newShipment.deviceIds,
        recipientName: newShipment.recipientName ?? '',
        address: newShipment.address ?? '',
        notes: newShipment.notes ?? ''
      });
      setNewShipment({
        carrier: '',
        tracking: '',
        status: 'packing',
        deviceIds: [],
        recipientName: '',
        address: '',
        notes: ''
      });
      setShipmentMessage('Shipment created.');
    } catch (error) {
      console.error('Failed to create shipment:', error);
      setShipmentMessage('Unable to create shipment.');
    }
  };

  const handleShipmentStatus = async (id: string, status: ShipmentStatus) => {
    try {
      await updateShipment(id, { status });
    } catch (error) {
      console.error('Failed to update shipment status:', error);
    }
  };

  const handleAddAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextEmail = adminEmailDraft.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes('@')) {
      setAdminAction('error');
      setAdminMessage('Enter a valid email address.');
      return;
    }
    setAdminAction('saving');
    setAdminMessage(null);
    try {
      await addAdmin(nextEmail, userEmail || user?.email || '');
      setAdminEmailDraft('');
      setAdminAction('success');
      setAdminMessage('Admin added.');
    } catch (error) {
      console.error('Failed to add admin:', error);
      setAdminAction('error');
      setAdminMessage('Unable to add admin.');
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (email === userEmail) {
      return;
    }
    if (!window.confirm('Remove admin access for this account?')) {
      return;
    }
    try {
      await removeAdmin(email);
    } catch (error) {
      console.error('Failed to remove admin:', error);
    }
  };

  const onlineDevices = devices.filter((device) => device.status === 'online').length;
  const activeBatches = batches.filter((batch) => batch.status !== 'complete').length;
  const lowStockItems = inventoryItems.filter(
    (item) => item.reorderPoint !== undefined && item.onHand <= (item.reorderPoint ?? 0)
  ).length;
  const openPurchaseOrders = purchaseOrders.filter(
    (order) => order.status === 'ordered' || order.status === 'draft'
  ).length;
  const qaIssues = qaReports.filter((report) => report.result === 'fail').length;
  const shipmentsInFlight = shipments.filter((shipment) => shipment.status !== 'delivered').length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  if (!enabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-900">Admin access offline</h1>
          <p className="text-sm text-slate-600">
            Firebase is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* keys first.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-900">Sign in to administer</h1>
          <p className="text-sm text-slate-600">Use your admin account to view and manage the system.</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
            >
              Log in
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-2xl text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (adminStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-900">No admin access</h1>
          <p className="text-sm text-slate-600">
            {user.email ?? 'This account'} does not have admin access. Ask an admin to add you.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-3 rounded-2xl text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
            >
              Back to home
            </Link>
            <button
              onClick={signOut}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Admin Console</p>
            <h1 className="text-2xl font-serif text-slate-900">Tbay Connect Command Center</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              href="/live"
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
            >
              Live App
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Events</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{events.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active gatherings</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Devices online</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {onlineDevices}/{devices.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Connected now</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Active batches</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{activeBatches}</p>
            <p className="text-xs text-slate-500 mt-1">In production</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Low stock</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{lowStockItems}</p>
            <p className="text-xs text-slate-500 mt-1">Items at reorder</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Open POs</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{openPurchaseOrders}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting delivery</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">QA issues</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{qaIssues}</p>
            <p className="text-xs text-slate-500 mt-1">Fails to resolve</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Shipments</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{shipmentsInFlight}</p>
            <p className="text-xs text-slate-500 mt-1">In transit</p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Device registry</h2>
              <p className="text-xs text-slate-500">
                Register devices, encode IDs, and track manufacturing stages end-to-end.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {deviceError && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {deviceError}
                </span>
              )}
              {stageError && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {stageError}
                </span>
              )}
            </div>
          </div>

          <form
            onSubmit={handleCreateDevice}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Device ID"
                  value={newDevice.deviceId}
                  onChange={(event) => setNewDevice((prev) => ({ ...prev, deviceId: event.target.value }))}
                />
                <button
                  type="button"
                  onClick={generateDeviceId}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-white"
                >
                  Generate
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Serial"
                  value={newDevice.serial}
                  onChange={(event) => setNewDevice((prev) => ({ ...prev, serial: event.target.value }))}
                />
                <button
                  type="button"
                  onClick={generateSerial}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-white"
                >
                  Generate
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Device label"
                value={newDevice.label}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, label: event.target.value }))}
              />
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={newDevice.type}
                onChange={(event) =>
                  setNewDevice((prev) => ({ ...prev, type: event.target.value as WaitlistDeviceType }))
                }
              >
                {deviceTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={newDevice.status}
                onChange={(event) =>
                  setNewDevice((prev) => ({ ...prev, status: event.target.value as AdminDeviceStatus }))
                }
              >
                {deviceStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                max={100}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={newDevice.battery}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, battery: Number(event.target.value) }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Batch ID"
                value={newDevice.batchId}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, batchId: event.target.value }))}
              />
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={newDevice.lifecycle}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, lifecycle: event.target.value }))}
              >
                <option value="">Lifecycle</option>
                {lifecycleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Firmware"
                value={newDevice.firmware}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, firmware: event.target.value }))}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Key ID"
                value={newDevice.keyId}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, keyId: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Assigned to"
                value={newDevice.assignedTo}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, assignedTo: event.target.value }))}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes (short)"
                value={newDevice.notes}
                onChange={(event) => setNewDevice((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              {createMessage && (
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    createStatus === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {createMessage}
                </span>
              )}
              <button
                type="submit"
                disabled={createStatus === 'saving'}
                className="ml-auto px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {createStatus === 'saving' ? 'Saving...' : 'Register device'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {devices.length === 0 && <div className="text-sm text-slate-500">No devices registered yet.</div>}
            {devices.map((device) => {
              const draft = deviceDrafts[device.id];
              const isExpanded = expandedDeviceId === device.id;
              const stageSummary = MANUFACTURING_STAGES.reduce(
                (acc, stage) => {
                  const status = device.stages?.[stage.id]?.status ?? 'not_started';
                  if (status === 'pass' || status === 'skipped') {
                    acc.completed += 1;
                  }
                  if (status === 'in_progress') {
                    acc.inProgress += 1;
                  }
                  if (status === 'blocked' || status === 'fail') {
                    acc.blocked += 1;
                  }
                  return acc;
                },
                { completed: 0, inProgress: 0, blocked: 0 }
              );
              const progress = Math.round(
                (stageSummary.completed / Math.max(1, MANUFACTURING_STAGES.length)) * 100
              );
              return (
                <div key={device.id} className="border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900">{device.label}</h3>
                      <p className="text-xs text-slate-500">
                        {device.type} • ID {device.deviceId || device.id} • Serial {device.serial || '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Batch {device.batchId || '—'} • Firmware {device.firmware || '—'} • Key{' '}
                        {device.keyId || '—'}
                      </p>
                      <p className="text-xs text-slate-500">Last seen {formatDate(device.lastSeen)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        {device.status}
                      </span>
                      <span className="px-2 py-1 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        {device.lifecycle || 'lifecycle'}
                      </span>
                      <span className="px-2 py-1 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        {device.battery}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedDeviceId(isExpanded ? null : device.id)}
                        className="px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
                      >
                        {isExpanded ? 'Hide stages' : 'Stages'}
                      </button>
                      <button
                        onClick={() => pingDevice(device.id)}
                        className="px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
                      >
                        Ping
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="px-3 py-1.5 rounded-full border border-rose-200 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {stageSummary.completed}/{MANUFACTURING_STAGES.length} stages complete
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {stageSummary.inProgress} in progress • {stageSummary.blocked} blocked or failed
                    </p>
                  </div>

                  {draft && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Device ID"
                        value={draft.deviceId ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'deviceId', event.target.value)}
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Serial"
                        value={draft.serial ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'serial', event.target.value)}
                      />
                    </div>
                  )}
                  {draft && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.label}
                        onChange={(event) => handleDraftChange(device.id, 'label', event.target.value)}
                      />
                      <select
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.type}
                        onChange={(event) =>
                          handleDraftChange(device.id, 'type', event.target.value as WaitlistDeviceType)
                        }
                      >
                        {deviceTypeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <select
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.status}
                        onChange={(event) =>
                          handleDraftChange(device.id, 'status', event.target.value as AdminDeviceStatus)
                        }
                      >
                        {deviceStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.battery}
                        onChange={(event) => handleDraftChange(device.id, 'battery', Number(event.target.value))}
                      />
                    </div>
                  )}
                  {draft && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Batch ID"
                        value={draft.batchId ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'batchId', event.target.value)}
                      />
                      <select
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.lifecycle ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'lifecycle', event.target.value)}
                      >
                        <option value="">Lifecycle</option>
                        {lifecycleOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Firmware"
                        value={draft.firmware ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'firmware', event.target.value)}
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Key ID"
                        value={draft.keyId ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'keyId', event.target.value)}
                      />
                    </div>
                  )}
                  {draft && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Assigned to"
                        value={draft.assignedTo ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'assignedTo', event.target.value)}
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Notes"
                        value={draft.notes ?? ''}
                        onChange={(event) => handleDraftChange(device.id, 'notes', event.target.value)}
                      />
                    </div>
                  )}
                  {draft && (
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleSaveDevice(device.id)}
                        disabled={deviceSavingId === device.id}
                        className="px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {deviceSavingId === device.id ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-slate-200 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Manufacturing stages</h4>
                        <span className="text-xs text-slate-500">Update status per stage.</span>
                      </div>
                      {Object.entries(stagesByPhase).map(([phase, stages]) => (
                        <div key={phase} className="space-y-3">
                          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">
                            {phase}
                          </p>
                          <div className="space-y-2">
                            {stages.map((stage) => {
                              const key = stageKey(device.id, stage.id);
                              const stageDraft = stageDrafts[key];
                              const stageData = device.stages?.[stage.id];
                              return (
                                <div
                                  key={stage.id}
                                  className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr_1fr_auto] gap-2 items-center border border-slate-200 rounded-xl p-3"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{stage.label}</p>
                                    <p className="text-xs text-slate-500">{stage.description}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {stageData?.updatedAt
                                        ? `Updated ${formatDate(stageData.updatedAt)}${
                                            stageData.updatedBy ? ` • ${stageData.updatedBy}` : ''
                                          }`
                                        : 'No updates yet'}
                                    </p>
                                  </div>
                                  <select
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    value={stageDraft?.status ?? stageData?.status ?? 'not_started'}
                                    onChange={(event) =>
                                      handleStageDraftChange(
                                        device.id,
                                        stage.id,
                                        'status',
                                        event.target.value as ManufacturingStageStatus
                                      )
                                    }
                                  >
                                    {stageStatusOptions.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Notes"
                                    value={stageDraft?.notes ?? ''}
                                    onChange={(event) =>
                                      handleStageDraftChange(device.id, stage.id, 'notes', event.target.value)
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStage(device.id, stage.id)}
                                    disabled={stageSaving === key}
                                    className="px-3 py-2 rounded-xl bg-slate-900 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60"
                                  >
                                    {stageSaving === key ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Manufacturing batches</h2>
              <p className="text-xs text-slate-500">Plan production runs and track volume.</p>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Batch name"
                  value={newBatch.name}
                  onChange={(event) => setNewBatch((prev) => ({ ...prev, name: event.target.value }))}
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newBatch.status}
                  onChange={(event) =>
                    setNewBatch((prev) => ({ ...prev, status: event.target.value as BatchStatus }))
                  }
                >
                  {batchStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Target count"
                  value={newBatch.targetCount}
                  onChange={(event) =>
                    setNewBatch((prev) => ({ ...prev, targetCount: Number(event.target.value) }))
                  }
                />
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes"
                value={newBatch.notes}
                onChange={(event) => setNewBatch((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                {batchMessage && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {batchMessage}
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
                >
                  Create batch
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {batches.length === 0 && <div className="text-sm text-slate-500">No batches yet.</div>}
              {batches.map((batch) => (
                <div key={batch.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{batch.name}</h3>
                      <p className="text-xs text-slate-500">
                        Target {batch.targetCount} • Created {formatDate(batch.createdAt)}
                      </p>
                    </div>
                    <select
                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                      value={batch.status}
                      onChange={(event) =>
                        handleBatchStatusChange(batch.id, event.target.value as BatchStatus)
                      }
                    >
                      {batchStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Notes"
                    defaultValue={batch.notes ?? ''}
                    onBlur={(event) => handleBatchNotes(batch.id, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">QA reports</h2>
              <p className="text-xs text-slate-500">Track testing results and rework notes.</p>
            </div>
            <form onSubmit={handleCreateQaReport} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newQaReport.deviceId}
                  onChange={(event) =>
                    setNewQaReport((prev) => ({ ...prev, deviceId: event.target.value }))
                  }
                >
                  <option value="">Select device</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.deviceId || device.id}>
                      {device.label} ({device.deviceId || device.id})
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newQaReport.result}
                  onChange={(event) =>
                    setNewQaReport((prev) => ({ ...prev, result: event.target.value as QaResult }))
                  }
                >
                  {qaResultOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Summary"
                value={newQaReport.summary}
                onChange={(event) => setNewQaReport((prev) => ({ ...prev, summary: event.target.value }))}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Issues or rework notes"
                value={newQaReport.issues}
                onChange={(event) => setNewQaReport((prev) => ({ ...prev, issues: event.target.value }))}
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                {qaMessage && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {qaMessage}
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
                >
                  Save QA report
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {qaReports.length === 0 && <div className="text-sm text-slate-500">No QA reports yet.</div>}
              {qaReports.map((report) => (
                <div key={report.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{report.deviceId}</h3>
                      <p className="text-xs text-slate-500">Logged {formatDate(report.createdAt)}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                      {report.result}
                    </span>
                  </div>
                  {report.summary && <p className="text-xs text-slate-600">{report.summary}</p>}
                  {report.issues && <p className="text-xs text-slate-500">Issues: {report.issues}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Inventory</h2>
              <p className="text-xs text-slate-500">Track parts, lead times, and reorder levels.</p>
            </div>
            <form onSubmit={handleCreateInventoryItem} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Part name"
                  value={newInventoryItem.name}
                  onChange={(event) => setNewInventoryItem((prev) => ({ ...prev, name: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="SKU"
                  value={newInventoryItem.sku}
                  onChange={(event) => setNewInventoryItem((prev) => ({ ...prev, sku: event.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Supplier"
                  value={newInventoryItem.supplier}
                  onChange={(event) =>
                    setNewInventoryItem((prev) => ({ ...prev, supplier: event.target.value }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Category"
                  value={newInventoryItem.category}
                  onChange={(event) =>
                    setNewInventoryItem((prev) => ({ ...prev, category: event.target.value }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Location"
                  value={newInventoryItem.location}
                  onChange={(event) =>
                    setNewInventoryItem((prev) => ({ ...prev, location: event.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="number"
                  min={0}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="On hand"
                  value={newInventoryItem.onHand}
                  onChange={(event) =>
                    setNewInventoryItem((prev) => ({ ...prev, onHand: Number(event.target.value) }))
                  }
                />
                <input
                  type="number"
                  min={0}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Reorder point"
                  value={newInventoryItem.reorderPoint}
                  onChange={(event) =>
                    setNewInventoryItem((prev) => ({
                      ...prev,
                      reorderPoint: Number(event.target.value)
                    }))
                  }
                />
                <input
                  type="number"
                  min={0}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Unit cost"
                  value={newInventoryItem.unitCost}
                  onChange={(event) =>
                    setNewInventoryItem((prev) => ({ ...prev, unitCost: Number(event.target.value) }))
                  }
                />
                <input
                  type="number"
                  min={0}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Lead time (days)"
                  value={newInventoryItem.leadTimeDays}
                  onChange={(event) =>
                    setNewInventoryItem((prev) => ({
                      ...prev,
                      leadTimeDays: Number(event.target.value)
                    }))
                  }
                />
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes"
                value={newInventoryItem.notes}
                onChange={(event) => setNewInventoryItem((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                {inventoryMessage && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {inventoryMessage}
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
                >
                  Add inventory
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {inventoryItems.length === 0 && <div className="text-sm text-slate-500">No parts yet.</div>}
              {inventoryItems.map((item) => {
                const draft = inventoryDrafts[item.id];
                if (!draft) {
                  return null;
                }
                return (
                  <div key={item.id} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                        <p className="text-xs text-slate-500">
                          SKU {item.sku} • Updated {formatDate(item.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleInventorySave(item.id)}
                        disabled={inventorySavingId === item.id}
                        className="px-3 py-1.5 rounded-full bg-slate-900 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {inventorySavingId === item.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.name}
                        onChange={(event) => handleInventoryDraftChange(item.id, 'name', event.target.value)}
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.sku}
                        onChange={(event) => handleInventoryDraftChange(item.id, 'sku', event.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Supplier"
                        value={draft.supplier ?? ''}
                        onChange={(event) =>
                          handleInventoryDraftChange(item.id, 'supplier', event.target.value)
                        }
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Category"
                        value={draft.category ?? ''}
                        onChange={(event) =>
                          handleInventoryDraftChange(item.id, 'category', event.target.value)
                        }
                      />
                      <input
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Location"
                        value={draft.location ?? ''}
                        onChange={(event) =>
                          handleInventoryDraftChange(item.id, 'location', event.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <input
                        type="number"
                        min={0}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.onHand}
                        onChange={(event) =>
                          handleInventoryDraftChange(item.id, 'onHand', Number(event.target.value))
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.reorderPoint ?? 0}
                        onChange={(event) =>
                          handleInventoryDraftChange(item.id, 'reorderPoint', Number(event.target.value))
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.unitCost ?? 0}
                        onChange={(event) =>
                          handleInventoryDraftChange(item.id, 'unitCost', Number(event.target.value))
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={draft.leadTimeDays ?? 0}
                        onChange={(event) =>
                          handleInventoryDraftChange(item.id, 'leadTimeDays', Number(event.target.value))
                        }
                      />
                    </div>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Notes"
                      value={draft.notes ?? ''}
                      onChange={(event) => handleInventoryDraftChange(item.id, 'notes', event.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Purchase orders</h2>
              <p className="text-xs text-slate-500">Place orders and track deliveries.</p>
            </div>
            <form onSubmit={handleCreatePurchaseOrder} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Supplier"
                  value={newPo.supplier}
                  onChange={(event) => setNewPo((prev) => ({ ...prev, supplier: event.target.value }))}
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newPo.status}
                  onChange={(event) =>
                    setNewPo((prev) => ({ ...prev, status: event.target.value as PurchaseOrderStatus }))
                  }
                >
                  {purchaseOrderStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newPo.orderedAt ? newPo.orderedAt.toISOString().slice(0, 10) : ''}
                  onChange={(event) =>
                    setNewPo((prev) => ({
                      ...prev,
                      orderedAt: event.target.value ? new Date(event.target.value) : null
                    }))
                  }
                />
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newPo.expectedAt ? newPo.expectedAt.toISOString().slice(0, 10) : ''}
                  onChange={(event) =>
                    setNewPo((prev) => ({
                      ...prev,
                      expectedAt: event.target.value ? new Date(event.target.value) : null
                    }))
                  }
                />
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes"
                value={newPo.notes ?? ''}
                onChange={(event) => setNewPo((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className="border border-slate-200 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Line items</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="SKU"
                    value={poItemDraft.sku}
                    onChange={(event) => setPoItemDraft((prev) => ({ ...prev, sku: event.target.value }))}
                  />
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Item name"
                    value={poItemDraft.name}
                    onChange={(event) => setPoItemDraft((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <input
                    type="number"
                    min={1}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Qty"
                    value={poItemDraft.qty}
                    onChange={(event) =>
                      setPoItemDraft((prev) => ({ ...prev, qty: Number(event.target.value) }))
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Unit cost"
                    value={poItemDraft.unitCost}
                    onChange={(event) =>
                      setPoItemDraft((prev) => ({ ...prev, unitCost: Number(event.target.value) }))
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
                  >
                    Add line
                  </button>
                </div>
                {poItems.length > 0 && (
                  <div className="space-y-2">
                    {poItems.map((item, index) => (
                      <div key={`${item.sku}-${index}`} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-600">
                          {item.name} ({item.sku}) • {item.qty} @ ${item.unitCost}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemovePoItem(index)}
                          className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                {poMessage && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {poMessage}
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
                >
                  Create PO
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {purchaseOrders.length === 0 && (
                <div className="text-sm text-slate-500">No purchase orders yet.</div>
              )}
              {purchaseOrders.map((order) => {
                const total = order.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
                return (
                  <div key={order.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{order.supplier}</h3>
                        <p className="text-xs text-slate-500">
                          {order.items.length} items • Total ${total.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Ordered {formatDate(order.orderedAt)} • Expected {formatDate(order.expectedAt)}
                        </p>
                      </div>
                      <select
                        className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                        value={order.status}
                        onChange={(event) =>
                          handlePurchaseOrderStatus(order.id, event.target.value as PurchaseOrderStatus)
                        }
                      >
                        {purchaseOrderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-xs text-slate-600">
                      {order.items.map((item) => `${item.name} (${item.qty})`).join(', ')}
                    </div>
                    {order.notes && <p className="text-xs text-slate-500">Notes: {order.notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Firmware releases</h2>
              <p className="text-xs text-slate-500">Track versions and rollout status.</p>
            </div>
            <form onSubmit={handleCreateFirmware} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Version"
                  value={newFirmware.version}
                  onChange={(event) => setNewFirmware((prev) => ({ ...prev, version: event.target.value }))}
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={newFirmware.status}
                  onChange={(event) =>
                    setNewFirmware((prev) => ({ ...prev, status: event.target.value as FirmwareStatus }))
                  }
                >
                  {firmwareStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Checksum"
                value={newFirmware.checksum}
                onChange={(event) => setNewFirmware((prev) => ({ ...prev, checksum: event.target.value }))}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes"
                value={newFirmware.notes}
                onChange={(event) => setNewFirmware((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                {firmwareMessage && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {firmwareMessage}
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
                >
                  Add firmware
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {firmwareReleases.length === 0 && (
                <div className="text-sm text-slate-500">No firmware releases yet.</div>
              )}
              {firmwareReleases.map((release) => (
                <div key={release.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{release.version}</h3>
                      <p className="text-xs text-slate-500">Created {formatDate(release.createdAt)}</p>
                    </div>
                    <select
                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                      value={release.status}
                      onChange={(event) =>
                        handleFirmwareStatus(release.id, event.target.value as FirmwareStatus)
                      }
                    >
                      {firmwareStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  {release.checksum && <p className="text-xs text-slate-600">Checksum: {release.checksum}</p>}
                  {release.notes && <p className="text-xs text-slate-500">Notes: {release.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Fulfillment</h2>
              <p className="text-xs text-slate-500">Ship devices and track deliveries.</p>
            </div>
            <form onSubmit={handleCreateShipment} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Carrier"
                  value={newShipment.carrier}
                  onChange={(event) => setNewShipment((prev) => ({ ...prev, carrier: event.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Tracking #"
                  value={newShipment.tracking}
                  onChange={(event) => setNewShipment((prev) => ({ ...prev, tracking: event.target.value }))}
                />
              </div>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={newShipment.status}
                onChange={(event) =>
                  setNewShipment((prev) => ({ ...prev, status: event.target.value as ShipmentStatus }))
                }
              >
                {shipmentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Device IDs (comma separated)"
                value={newShipment.deviceIds.join(', ')}
                onChange={(event) => {
                  const ids = event.target.value
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean);
                  setNewShipment((prev) => ({ ...prev, deviceIds: ids }));
                }}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Recipient name"
                value={newShipment.recipientName}
                onChange={(event) =>
                  setNewShipment((prev) => ({ ...prev, recipientName: event.target.value }))
                }
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Shipping address"
                value={newShipment.address}
                onChange={(event) => setNewShipment((prev) => ({ ...prev, address: event.target.value }))}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes"
                value={newShipment.notes}
                onChange={(event) => setNewShipment((prev) => ({ ...prev, notes: event.target.value }))}
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                {shipmentMessage && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {shipmentMessage}
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
                >
                  Create shipment
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {shipments.length === 0 && <div className="text-sm text-slate-500">No shipments yet.</div>}
              {shipments.map((shipment) => (
                <div key={shipment.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {shipment.carrier || 'Carrier'} • {shipment.tracking || 'Tracking pending'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {shipment.deviceIds.length} devices • Created {formatDate(shipment.createdAt)}
                      </p>
                    </div>
                    <select
                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                      value={shipment.status}
                      onChange={(event) =>
                        handleShipmentStatus(shipment.id, event.target.value as ShipmentStatus)
                      }
                    >
                      {shipmentStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  {shipment.recipientName && (
                    <p className="text-xs text-slate-600">Recipient: {shipment.recipientName}</p>
                  )}
                  {shipment.address && <p className="text-xs text-slate-500">{shipment.address}</p>}
                  {shipment.deviceIds.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Devices: {shipment.deviceIds.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Admin access</h2>
              <p className="text-xs text-slate-500">Add or remove staff accounts with console access.</p>
            </div>
            <form onSubmit={handleAddAdmin} className="flex flex-wrap gap-2">
              <input
                className="flex-1 min-w-[200px] rounded-full border border-slate-200 px-4 py-2 text-sm"
                placeholder="new-admin@email.com"
                value={adminEmailDraft}
                onChange={(event) => {
                  setAdminEmailDraft(event.target.value);
                  if (adminAction !== 'saving') {
                    setAdminAction('idle');
                    setAdminMessage(null);
                  }
                }}
              />
              <button
                type="submit"
                disabled={adminAction === 'saving'}
                className="px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {adminAction === 'saving' ? 'Adding...' : 'Add admin'}
              </button>
            </form>
            {adminMessage && (
              <div
                className={`text-xs px-3 py-1 rounded-full ${
                  adminAction === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {adminMessage}
              </div>
            )}
            <div className="space-y-2">
              {admins.length === 0 && <div className="text-sm text-slate-500">No admins recorded yet.</div>}
              {admins.map((admin) => (
                <div key={admin.email} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{admin.email}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      Added {formatDate(admin.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin.email)}
                    disabled={admin.email === userEmail}
                    className="px-3 py-1.5 rounded-full border border-rose-200 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {admin.email === userEmail ? 'You' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Active events</h2>
              <p className="text-xs text-slate-500">Moderate gatherings in real time.</p>
            </div>
            <div className="space-y-3">
              {events.length === 0 && <div className="text-sm text-slate-500">No events yet.</div>}
              {events.map((event) => (
                <div key={event.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{event.title}</h3>
                      <p className="text-xs text-slate-500">
                        {event.category} • {event.time} • {event.participants} attending
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-3 py-1.5 rounded-full border border-rose-200 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">{event.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Waitlist pipeline</h2>
              <p className="text-xs text-slate-500">Track pre-orders and outreach.</p>
            </div>
            <div className="space-y-3">
              {waitlistEntries.length === 0 && (
                <div className="text-sm text-slate-500">No waitlist entries yet.</div>
              )}
              {waitlistEntries.map((entry) => (
                <div key={entry.id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{entry.name || 'Unnamed'}</p>
                      <p className="text-xs text-slate-500">{entry.email}</p>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                      {entry.deviceType}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    Interests: {entry.interests?.length ? entry.interests.join(', ') : 'None listed'}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-400">Joined {formatDate(entry.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                        value={entry.status ?? 'new'}
                        onChange={(event) => handleWaitlistStatus(entry.id, event.target.value)}
                      >
                        {waitlistStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteWaitlistEntry(entry.id)}
                        className="px-3 py-1.5 rounded-full border border-rose-200 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600 hover:bg-rose-50"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                  {entry.notes && <p className="text-xs text-slate-500">Notes: {entry.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
